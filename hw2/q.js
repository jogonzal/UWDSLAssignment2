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

// Join
function JoinNode(f, left, right) {
    ASTNode.call(this, "Join");
    this.f = f;
    this.left = left;
    this.right = right;
}

JoinNode.prototype = Object.create(ASTNode.prototype);

// HashJoin
function HashJoinNode(field, left, right) {
    ASTNode.call(this, "HashJoin");
    this.field = field;
    this.left = left;
    this.right = right;
}

HashJoinNode.prototype = Object.create(ASTNode.prototype);

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

function CartesianJoinArrays(first, second) {
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
CartesianProductNode.prototype.execute = function(table){
    var first = this.first.execute(table);
    var second = this.second.execute(table);
    return CartesianJoinArrays(first, second);
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

function BuildHashTable(field, table) {
    // Using Javascript associative arrays
    var res = new Array();

    for(var i = 0; i < table.length; i++){
        var fieldValue = table[i][field];
        if (res[fieldValue]){
            // Append to array
            res[fieldValue].push(table[i]);
        } else {
            // Initialize array
            res[fieldValue] = [table[i]];
        }
    }

    return res;
}

function Merge(firstElement, secondElement) {
    var res = [];
    var i;
    for(i = 0; i < secondElement.length; i++){
        res.push(secondElement[i]);
    }
    for(var k = i; k < firstElement.length; k++){
        res.push(firstElement[k]);
    }
    return res;
}

HashJoinNode.prototype.execute = function(table){
    var first = this.left.execute(table);
    var second = this.right.execute(table);

    var firstElementHashTable = BuildHashTable(this.field, first);
    var secondElementHashTable = BuildHashTable(this.field, second);

    var arr = [];
    for(var key in firstElementHashTable){
        // Check if this has matches in the second hashtable
        var firstElement = firstElementHashTable[key];
        var secondElement = secondElementHashTable[key];
        if (secondElement != null){
            var cartesian = CartesianJoinArrays(firstElement, secondElement);
            for(var element in cartesian){
                var mergedElement = Merge(element.left, element.right);
                arr.push(mergedElement);
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
        if (this.data != null && this.data.optimizableToJoinNode == true){
            // This can be optimized into a HashJoinNode
            return new HashJoinNode(this.data.field, this.first.first.left, this.first.first.right);
        }
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
    var newNode = new ThenNode(
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
    // For optimization
    newNode.data = f.data;
    return newNode;
}

//// Optimizing joins

// Optimization above

//// Join on fields

ASTNode.prototype.on = function(field){
    var f = function(left, right){
        return left[field] == right[field];
    };
    // For optimization purposes
    f.data = {
        optimizableToJoinNode : true,
        field : field
    };
    return f;
}

//// Implement hash joins

// HashJoin implemented above

//// Optimize joins on fields to hash joins

// ...
