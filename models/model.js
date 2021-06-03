const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    birthday: String,
    phone: Number,
    address: String,
    post: [{ type: mongoose.Schema.Types.Mixed, ref: 'Post' }]
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"})

exports.User = mongoose.model("User", userSchema);


const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
    date: String,
    name: String,
    content: String,
    img: {
        data: Buffer,
        contentType: String
    },
    comment: [{
        commenter: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        name: String,
        content: String
    }]
});

exports.Post = mongoose.model("Post", postSchema);

exports.Date = function(){
    const date = new Date();

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    return date.toLocaleDateString("en-US", options)
}

