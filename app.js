require("dotenv").config();

const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const _ = require("lodash");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Post, User, Date } = require("./models/model");

const app = express();

var http = require("http").Server(app);
var io = require("socket.io")(http);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/images")
    }, 
    filename: (req, file, cb)  => {
        cb(null, file.originalname + "-" + Date.now())
    }
});

const upload = multer({dest: "public/uploads/images"});


app.set("view engine", "ejs");

app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie:{ maxAge: 7 * 24 * 3600 * 1000}
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-" + process.env.ADMIN + ":" + process.env.PASSWORD + "@cluster0.hlmus.mongodb.net/testBookDB?retryWrites=true&w=majority", {useNewUrlParser:true, useUnifiedTopology:true, useFindAndModify: false});
mongoose.set('useCreateIndex', true);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


app.get("/", function(req, res){
    res.render("home", {foundUser: "undefined"})
})


app.get("/newsfeed", function(req, res){  

    if(req.isAuthenticated()){
        Post.find({}, function(err, foundItem){
            if(err){
                console.log(err);
            } else {
                const loggedUser = req.user;
                res.render("newsfeed", {posts: foundItem, loggedUser: loggedUser, foundUser: "undefined"});
            }
        }).sort({date: -1});
    } else {
        res.redirect("/");
    }

});

app.get("/profile/:userProfile", function (req, res) {
    const userId = req.params.userProfile;
    const loggedUser = req.user
    if(req.isAuthenticated){
        User.findById(userId,function(err, foundUser){
            if(err){
                console.log(err);
            } else {
                res.render("profile", {foundUser: foundUser, loggedUser:loggedUser});             
            }
        });
    } else {
        res.redirect("/login");
    }
})

app.get("/register", function(req, res){
    res.render("register", {foundUser: "undefined"})
});

app.get("/profileinfo", function(req, res){
    if(req.isAuthenticated()) {
        res.render("profileinfo", {foundUser: "undefined"});
    } else {
        res.redirect("/register",);
    }
});

app.get("/login", function(req, res){
    res.render("login",{foundUser: "undefined"});
});

app.get("/logout", function(req, res){
    req.logOut();
    res.redirect("/login");
});

app.post("/register", function(req, res){

    User.register({email: req.body.email}, req.body.password,
        
        function (err, user){
            if(err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/profileinfo");
                });
            };
        }
        );
});

app.post("/login", function(req, res){
    
    const user = new User({
        email: req.body.email,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate('local', function(err, user, info) {
                if (!user) {
                    return res.send('email or password is incoreect. please go back to login page and login again'); }
                req.logIn(user, function(err) {
                  if (err) { return next(err); }
                  return res.redirect('/newsfeed');
                });
              })(req, res);
        }
    });

});

app.post("/profileInfo", function (req, res) {

    User.findOne({_id: req.user.id}, function(err, foundUser){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            if(foundUser){
                foundUser.firstName = req.body.firstname,
                foundUser.lastName= req.body.lastname,
                foundUser.birthday = req.body.birthday,
                foundUser.phone = req.body.phone,
                foundUser.address = req.body.address            
                foundUser.save(function(err){
                    if(err){
                        console.log(err);
                        res.render("profileinfo");
                    } else {
                        res.redirect("/newsfeed");
                    }
                });
            };
        };
    });
  
});

app.post("/post", upload.single("image"), function(req, res, next){

    if (req.file) {
        User.findById(req.user._id, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                if (user) {
                    const post = new Post({
                        user: req.user,
                        date: Date(),
                        name: `${req.user.firstName} ${req.user.lastName}`,
                        content: req.body.content,
                        img: {
                            data: fs.readFileSync(path.join(__dirname + "/public/uploads/images/" + req.file.filename)).toString('base64'),
                            contentType: "image/png"
                        }
                    });
                    post.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            User.findByIdAndUpdate(req.user._id, { $push: { post: post } }, 
                                function (err, foundUser) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                     res.redirect("/newsfeed");
                                    };
                            });
                        };
                    });
                };
            };
        });
    } else {
        User.findById(req.user._id, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                if (user) {
                    const post = new Post({
                        user: req.user,
                        date: Date(),
                        name: `${req.user.firstName} ${req.user.lastName}`,
                        content: req.body.content
                    });
                    post.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            User.findByIdAndUpdate(req.user._id, { $push: { post: post } }, 
                                function (err, foundUser) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.redirect("/newsfeed");
                                    };
                            });
                        };
                    });
                };
            };
        });
    };

});

app.post("/profileUploadPost", upload.single("image"), function(req, res, next){
    console.log(req.body);
    if (req.file) {
        User.findById(req.user._id, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                if (user) {
                    const post = new Post({
                        user: req.user,
                        date: Date(),
                        name: `${req.user.firstName} ${req.user.lastName}`,
                        content: req.body.content,
                        img: {
                            data: fs.readFileSync(path.join(__dirname + "/public/uploads/images/" + req.file.filename)).toString('base64'),
                            contentType: "image/png"
                        }
                    });
                    post.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            User.findByIdAndUpdate(req.user._id, { $push: { post: post } }, 
                                function (err, foundUser) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                     res.redirect(`/profile/${req.user._id}`);
                                    };
                            });
                        };
                    });
                };
            };
        });
    } else {
        User.findById(req.user._id, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                if (user) {
                    const post = new Post({
                        user: req.user,
                        date: Date(),
                        name: `${req.user.firstName} ${req.user.lastName}`,
                        content: req.body.content
                    });
                    post.save(function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            User.findByIdAndUpdate(req.user._id, { $push: { post: post } }, 
                                function (err, foundUser) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.redirect(`/profile/${req.user._id}`);
                                    };
                            });
                        };
                    });
                };
            };
        });
    };

});

io.on("connection", function(socket){

    socket.on("editPost", function(postDetail){
        Post.findByIdAndUpdate(postDetail.postId, {$set: {content: postDetail.editedContent}}, function(err, foundPost){
            if(err){
                console.log(errr);
            } else {
                User.findByIdAndUpdate(postDetail.postUserId, {$set: {"post.$[outer].content": postDetail.editedContent}},
                    { "arrayFilters": [{"outer._id":  foundPost._id}]}, 
                    function (err, foundUser){
                    if(err){
                        console.log(err);
                    } else {
                        console.log(postDetail.editedContent);
                    }
                })
                socket.broadcast.emit("editPost", postDetail);
            }
        })
    })

    socket.on("deletePost", function(postDetail){
        Post.findByIdAndDelete(postDetail.postId, function(err, foundPost){
            if(err){
                console.log(err);
            } else {
                User.findByIdAndUpdate(postDetail.loggedUserId, {$pull: {post: {_id: foundPost._id} }} ,function(err, foundUser){
                    if(err){
                        console.log(err);
                    }
                });
                // fs.unlink(__dirname + "/public/uploads/images/" + req.file.filename)
                socket.broadcast.emit("deletePost", postDetail);  
            };
        });
    });

    socket.on("comment", function(comment){
        const mainComment = {
            name: comment.name,
            content: comment.content,
            commenter: comment.commenterId
            }
    
            Post.findByIdAndUpdate(comment.postId, {$push: {comment: mainComment}}, function(err, foundPost){
                if(err) {
                    console.log(err)
                } else {
                    User.findOneAndUpdate({_id: comment.postOwner}, {$push: {"post.$[outer].comment": mainComment}},
                    { "arrayFilters": [{"outer._id":  foundPost._id}]},
                    function(err, foundUser){
                        if(err){
                            console.log(err);
                        } else {
                        }
                    })
                    socket.broadcast.emit('comment', comment);  
                }
            })
        });
    
});

http.listen(process.env.PORT || 3000, function(){
    console.log("Server connected to port 3000");
});




