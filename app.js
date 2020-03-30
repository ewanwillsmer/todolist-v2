//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
}

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Coding"
});

const item2 = new Item({
  name: "Eat breakfast"
});

const item3 = new Item({
  name: "Coding"
});

const defaultItems = [item1, item2, item3]

// list schema with itemsschema nested in
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("list", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
//checks to Item DB to see if there are already items in DB
    if (foundItems.length === 0) {
      //if empty, adds default items to DB
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items added to DB!");
        }
      });
      res.redirect("/");
    } else {
      //if not empty, shows list of items to do
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});
//allows for dynamic URLs
app.get("/:customListName", function(req, res) {
  //
  const customListName = _.capitalize(req.params.customListName);
//looks for the customListName in DB
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
  //if no error and no list of customListName, makes new list
        const list = new List({
          name: customListName,
          items: []
        });
        list.save()
        res.redirect("/" + customListName)
      } else {
  //if list does exist, renders list.ejs
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res) {
//responds to the two inputs in list.ejs
  const itemName = req.body.newItem;
  const listName = req.body.list;
//defines new item
  const item = new Item({
    name: itemName
  });
//if you are just using the today list
  if (listName === "Today") {
    item.save();
    res.redirect("/");
//if you are adding to a different list
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
//adds the item to the list if it exists in the DB
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
//if the item you want to delete is in the home list
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("You successfully deleted the checked item.");
        res.redirect("/");
//if item is in a different list. Uses a mongo function with $
      } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, checkedItemId) {
          if (!err) {
//takes you back to the correct page at the end
            res.redirect("/" + listName);
          }
        });
      }

    });
  }

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
