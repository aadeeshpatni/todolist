// jshint esversion: 6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();
//setting the view engine as ejs
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connecting to mongodb
mongoose.connect("mongodb+srv://admin-aadeesh:test123@cluster0.fks0o.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

//schema for an item in a todo list
const itemsSchema = {
  name: String
};

//model for a document in the items collection in todolistDB
const Item = mongoose.model("Item", itemsSchema);

//schema for a todo list, which has a name and an array of items
const listsSchema = {
  name: String,
  items: [itemsSchema]
};

//model for a document in the lists collection in todolistDB
const List = mongoose.model("List", listsSchema);


const item1 = new Item({
  name: "Buy Food"
});
const item2 = new Item({
  name: "Cook Food"
});
const item3 = new Item({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

//get method for home route
app.get("/", function(req, res) {

  Item.find({}, function(err, items) {
    if(err) {
      console.log(err);
    } else{
      if(items.length === 0){
        Item.insertMany(defaultItems, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("Default items inserted to items collection.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items});
      }
    }
  });

});


//get method for custom lists
app.get("/:list", function(req, res) {
  const requestedList = _.capitalize(req.params.list);

  List.findOne({name: requestedList}, function(err, resultList) {
    if(err) {
      console.log(err);
    } else {
      if(!resultList) {
        //create a new list
        const list = new List({
          name: requestedList,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + requestedList);
      }
      else{
        //render the found list
        res.render("list", {listTitle: resultList.name, newListItems: resultList.items});
      }
    }
  });

});


//post method to add a new item to home route list
app.post("/", function(req, res) {
  const newItem = req.body.newItem;
  const listTitle = req.body.button;

  //if the new item is empty, dont add it
  if(newItem !== ""){

    const itemToInsert = new Item({
      name: newItem
    });

    //if the listTitle is "Today", we simply save the itemToInsert to the items schema and redirect to home route
    if(listTitle === "Today"){
      itemToInsert.save();
      res.redirect("/");
    } else{
      //else we find the listTitle in lists collection, append the itemToInsert to its items array and redirect
      List.findOne({name: listTitle}, function(err, foundList) {
        if(!err) {
          foundList.items.push(itemToInsert);
          foundList.save();
          res.redirect("/" + listTitle);
        }
      });
    }

  }

});


//post method to delete an element
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId, function(err) {
      if(err) {
        console.log(err);
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});


let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started successfully");
});
