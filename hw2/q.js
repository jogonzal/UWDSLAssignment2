/* Q is a small query language for JavaScript.
 *
 * Q supports simple queries over a JSON-style data structure,
 * kinda like the functional version of LINQ in C#.
 *
 * ©2016, Pavel Panchekha and the University of Washington.
 * Released under the MIT license.
 */

//// The AST

// This class represents all AST Nodes.
function ASTNode(type) {
    this.type = type;
}

ASTNode.prototype = {};

// The All node just outputs all records.
function AllNode() {
    ASTNode.call(this, "All");
}

// This is how we make AllNode subclass from ASTNode.
AllNode.prototype = Object.create(ASTNode.prototype);

// The Filter node uses a callback to throw out some records.
function FilterNode(callback) {
    ASTNode.call(this, "Filter");
    this.callback = callback;
}

FilterNode.prototype = Object.create(ASTNode.prototype);

// The Then node chains multiple actions on one data structure.
function ThenNode(first, second) {
    ASTNode.call(this, "Then");
    this.first = first;
    this.second = second;
}

ThenNode.prototype = Object.create(ASTNode.prototype);

// The ApplyNode is like a SELECt in LINQ
function ApplyNode(callback) {
    ASTNode.call(this, "Apply");
    this.callback = callback;
}

ApplyNode.prototype = Object.create(ASTNode.prototype);

// The CountNode is like a COUNT in LINQ
function CountNode() {
    ASTNode.call(this, "Count");
}

CountNode.prototype = Object.create(ASTNode.prototype);

// The CountIfNode is like a COUNT + WHERE in LINQ
function CountIfNode() {
    ASTNode.call(this, "CountIf");
}

CountIfNode.prototype = Object.create(ASTNode.prototype);

// Cartesian product
function CartesianProductNode(first, second) {
    ASTNode.call(this, "CartesianProduct");
    this.first = first;
    this.second = second;
}

CartesianProductNode.prototype = Object.create(ASTNode.prototype);

// Cartesian product
function JoinNode(f, left, right) {
    ASTNode.call(this, "Join");
    this.f = f;
    this.left = left;
    this.right = right;
}

JoinNode.prototype = Object.create(ASTNode.prototype);

//// Executing queries

ASTNode.prototype.execute = function(table) {
    throw new Error("Unimplemented AST node " + this.type)
}

ThenNode.prototype.execute = function(table){
    var firstValue = this.first.execute(table);
    var secondValue = this.second.execute(firstValue);
    return secondValue;
}

AllNode.prototype.execute = function(table){
    return table.slice();
}

FilterNode.prototype.execute = function(table){
    var arr = [];
    for(var i = 0; i < table.length; i++){
        var element = table[i];
        if (this.callback(element)){
            arr.push(element);
        }
    }
    return arr;
}

ApplyNode.prototype.execute = function(table){
    var arr = [];
    for(var i = 0; i < table.length; i++){
        var element = this.callback(table[i]);
        arr.push(element);
    }
    return arr;
}

CountNode.prototype.execute = function(table){
    var res = [table.length];
    return res;
}

CountIfNode.prototype.execute = function(table){
    var count = 0;
    for(var i = 0; i < table.length; i++){
        var element = table[i];
        if (this.callback(element)){
            count++;
        }
    }
    return [count];
}

CartesianProductNode.prototype.execute = function(table){
    var first = this.first.execute(table);
    var second = this.second.execute(table);
    var arr = [];
    for(var i = 0; i < first.length; i++){
        var firstElement = first[i];
        for(var k = 0; k < second.length; k++) {
            var secondElement = second[k];
            var elem = {
                left: firstElement,
                right: secondElement
            };
            arr.push(elem);
        }
    }
    return arr;
}

JoinNode.prototype.execute = function(table){
    var first = this.left.execute(table);
    var second = this.right.execute(table);
    var arr = [];
    for(var i = 0; i < first.length; i++){
        var firstElement = first[i];
        for(var k = 0; k < second.length; k++) {
            var secondElement = second[k];
            if (this.f(firstElement, secondElement)){
                var res = [];
                var i;
                for(i = 0; i < secondElement.length; i++){
                    res.push(secondElement[i]);
                }
                for(var k = i; k < firstElement.length; k++){
                    res.push(firstElement[k]);
                }
                arr.push(res);
            }
        }
    }
    return arr;
}

//// Write a query
// Define the `thefts_query` and `auto_thefts_query` variables

var thefts_query = new FilterNode(function(element){ return element[13].match(/THEFT/);});
var auto_thefts_query = new FilterNode(function(element){ return element[13].match(/^VEH-THEFT/);});

//// Add Apply and Count nodes

// added above!

//// Clean the data

var cleanup_query = new ApplyNode(function(row){
    return {
        type:row[13],
        description:row[15],
        date:row[17],
        area:row[18]
    }
});


//// Implement a call-chaining interface

Q = Object.create(new AllNode());

ASTNode.prototype.filter = function(callback){
    var f = new FilterNode(callback);
    return new ThenNode(this, f);
}

ASTNode.prototype.apply = function(callback){
    var f = new ApplyNode(callback);
    return new ThenNode(this, f);
}

ASTNode.prototype.count = function(){
    var f = new CountNode();
    return new ThenNode(this, f);
}

//// Reimplement queries with call-chaining

var cleanup_query_2 = Q.apply( function(row){
    return {
        type:row[13],
        description:row[15],
        date:row[17],
        area:row[18]
    };
});

var thefts_query_2 = Q.filter(
    function(element){
        return element.type.match(/THEFT/);
    });

var auto_thefts_query_2 = Q.filter(
    function(element){
        return element.type.match(/^VEH-THEFT/);
    });

//// Optimize filters

ASTNode.prototype.optimize = function() { return this; }

ThenNode.prototype.optimize = function() {
    return new ThenNode(this.first.optimize(), this.second.optimize())
}

// We add a "run" method that is like "execute" but optimizes queries first.

ASTNode.prototype.run = function(data) {
    this.optimize().execute(data);
}

function AddOptimization(node_type, f) {
    var old = node_type.prototype.optimize;
    node_type.prototype.optimize = function() {
        var new_this = old.apply(this, arguments);
        return f.apply(new_this, arguments) || new_this;
    }
}

// Optimization for two filters
AddOptimization(ThenNode, function() {
    if (this.first instanceof ThenNode && this.second instanceof FilterNode
        && this.first.second instanceof FilterNode) {
        return new ThenNode(this.first.first, new FilterNode(this.first.second.callback && this.second.callback));
    }
});

// COUNTIF node defined above

// Optimization for a count and a filter together
AddOptimization(ThenNode, function() {
    if (this.first instanceof ThenNode && this.second instanceof CountNode
        && this.first.second instanceof FilterNode) {
        return new ThenNode(this.first.first, new CountIfNode(this.first.second.callback));
    }
    if (this.first instanceof ThenNode
            && this.first.first instanceof CartesianProductNode
            && this.first.second instanceof FilterNode
        && this.second instanceof ApplyNode) {
        return new JoinNode(this.first.second.callback, this.first.first.left, this.first.first.right);
    }
});

//// Internal node types and CountIf

// CountIf defined above

//// Cartesian Products

// cartesian node defined above

//// Joins

ASTNode.prototype.product = function(left, right){
    // first, use a cartesianNode to join left and right
    return new CartesianProductNode(left, right);
}

ASTNode.prototype.join = function(f, left, right){
    // first, use a cartesianNode to join left and right, then use a filter and an apply
    return new ThenNode(
            new ThenNode(
                new CartesianProductNode(left, right),
                new FilterNode(function(element){
                    return f(element.left, element.right);
                })
            ),
            new ApplyNode(function(element){
                var res = [];
                var i;
                for(i = 0; i < element.right.length; i++){
                    res.push(element.right[i]);
                }
                for(var k = i; k < element.left.length; k++){
                    res.push(element.left[k]);
                }
                return res;
            })
        );
}

//// Optimizing joins

// Optimization above

//// Join on fields

ASTNode.prototype.on = function(field){
    return function(left, right){
        return left[field] == right[field];
    };
}

//// Implement hash joins

// ...




//// Optimize joins on fields to hash joins

// ...
