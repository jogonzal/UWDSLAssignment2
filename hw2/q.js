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

//// Write a query
// Define the `thefts_query` and `auto_thefts_query` variables

var thefts_query = new FilterNode(function(element){ return element[13].match(/THEFT/);});
var auto_thefts_query = new FilterNode(function(element){ return element[13].match(/^VEH-THEFT/);});

//// Add Apply and Count nodes

// added above

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

// ...

Q = Object.create(new AllNode());




//// Reimplement queries with call-chaining

var cleanup_query_2 = Q; // ...

var thefts_query_2 = Q; // ...

var auto_thefts_query_2 = Q; // ...




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

// ...




//// Internal node types and CountIf

// ...




//// Cartesian Products

// ...




//// Joins

// ...




//// Optimizing joins

// ...




//// Join on fields

// ...




//// Implement hash joins

// ...




//// Optimize joins on fields to hash joins

// ...
