// Shadow on scroll

$(window).scroll(function() {     

    var scroll = $(window).scrollTop();
    if (scroll > 0) {
        $(".navbar").css("box-shadow", "0 0 10px rgba(0,0,0,0.4)");
    }
    else {
        $(".navbar").css("box-shadow", "none");
    }
});



// Upload Post Overlay

const overlay = document.querySelector(".overlay");
const upload = document.querySelector(".upload");
const closeButton = document.querySelector(".fa-times");
const showOverlay = document.querySelector("button.showOverlay");

overlay.addEventListener("click", function(){
    upload.style.display = "none"
});

closeButton.addEventListener("click", function(){
    upload.style.display = "none"
});

showOverlay.addEventListener("click", function(){
    upload.style.display = "block"
});

// Profile Dropdown Menu

$(".fa-caret-down").click(function(){
    $(".profileDropdownMenu").toggle();
});

$(document).on("click", function(event){
    var $trigger = document.querySelector(".fa-caret-down");
    if($trigger !== event.target){
        $(".profileDropdownMenu").hide();
    }            
});

// Post Dropdown Menu

let click = false;
const postDropdown = document.querySelectorAll(".postDropdown");
const ellipsis = document.querySelectorAll(".fa-ellipsis-h");

for(let i=0; i<ellipsis.length; i++){

    const postedUserId = document.querySelectorAll(".postedUserId");
    const loggedUserId  = document.querySelectorAll(".loggedUserId");
    const imageValue = document.querySelectorAll(".imageValue");
    const post = document.querySelectorAll(".post");

    if(postedUserId[i].value === loggedUserId[i].value){
        ellipsis[i].addEventListener("click", function () { 
            if(click === false){
                postDropdown[i].style.display = "block";
                click = true;
            } else {
                postDropdown[i].style.display = "none";
                click = false;
            }
            post[i].addEventListener("click", function(event){
                if(ellipsis[i] != event.target){
                    postDropdown[i].style.display = "none";
                    click = false;
                }
            })
        });
    } else {
        ellipsis[i].style.display = "none"
    }
}


// Delete Post Overlay 

const deletePostBox = document.querySelectorAll(".deletePostBox");

for(let i=0; i<deletePostBox.length; i++){

    const deletePostOverlay = document.querySelectorAll(".deletePostBox .overlay");
    const cancelDelete = document.querySelectorAll(".cancelDelete");
    const deletePostDropdown = document.querySelectorAll("#deletePost");
    const deletePost = document.querySelectorAll(".deletePost");

    deletePostDropdown[i].addEventListener("click", function () {
        deletePostBox[i].style.display = "block";
    });

    deletePostOverlay[i].addEventListener("click", function(){
        deletePostBox[i].style.display = "none";
    });

    cancelDelete[i].addEventListener("click", function(){
        deletePostBox[i].style.display = "none";
    });

    deletePost[i].addEventListener("click", function(){
        deletePostBox[i].style.display = "none";
    })

}

// Edit Post Overlay 

const editPostBox = document.querySelectorAll(".editPostBox");

for(let i=0; i<editPostBox.length; i++){

    const editPost = document.querySelectorAll("#editPost");
    const editPostOverlay = document.querySelectorAll(".editPostBox .overlay");
    const cancelEdit = document.querySelectorAll(".cancelEdit");
    const saveEdit = document.querySelectorAll(".saveEdit");
    
    editPost[i].addEventListener("click", function(){
        editPostBox[i].style.display = "block";
    });

    editPostOverlay[i].addEventListener("click", function(){
        editPostBox[i].style.display = "none";
    });

    cancelEdit[i].addEventListener("click", function(){
        editPostBox[i].style.display = "none";
    });

    saveEdit[i].addEventListener("click", function(){
        editPostBox[i].style.display = "none"
    })

}


// Realtime with socket.io

const socket = io();

// Edit post

const saveEdit = document.querySelectorAll(".saveEdit");

for(let i=0; i<saveEdit.length; i++){
    saveEdit[i].addEventListener("click", function(){
        const postId = document.querySelectorAll(".postIdInPostEditor");
        const editedContent = document.querySelectorAll(".editContent");
        const postContent = document.querySelectorAll(".post .content");
        const postUserId = document.querySelectorAll(".postedUserId");

        const postDetail = {
            postId: postId[i].value,
            postUserId: postUserId[i].value,
            editedContent: editedContent[i].value
        }
        console.log(editedContent[i].value);
        postContent[i].innerHTML = editedContent[i].value;
        socket.emit("editPost", postDetail)
    });
};

socket.on("editPost", function(postDetail){
        postContent[i].innerHTML = editedContent[i].value;
})

// Delete post

const deletePost = document.querySelectorAll(".deletePost");
const post = document.querySelectorAll(".post");

for(let i=0; i<deletePost.length; i++){

    deletePost[i].addEventListener("click", function(){
        const postId = document.querySelectorAll(".postIdInPostEditor");
        const loggedUser  = document.querySelectorAll(".loggedUserId");
        const postDetail = {
            postId: postId[i].value,
            loggedUserId: loggedUser[i].value
        }
        post[i].remove();
        
        socket.emit("deletePost", postDetail);
    });
};

socket.on("deletePost", function(postDetail){
    const postId = document.querySelectorAll(".postId");
    const postIdValue = postId[i].value;
    if(postIdValue === postDetail.postId){
        post[i].remove();
    }
});


// Comment

const sendButton = document.querySelectorAll("#send");

for(let i=0; i<post.length; i++){
    sendButton[i].addEventListener("click",function(){

        const name = document.querySelectorAll(".commenter");
        const content = document.querySelectorAll(".addComment");
        const postId = document.querySelectorAll(".postId");
        const commentDiv = document.querySelectorAll("div.comment");
        const postOwner = document.querySelectorAll(".postOwner");
        const postOwnerName = document.querySelectorAll(".postOwnerName");
        const commenterId = document.querySelectorAll(".commenterId");

        console.log(postOwnerName[i].value);

        if (content[i].value != ""){
            var comment = {
                name:  name[i].value,
                content: content[i].value,
                postId: postId[i].value,
                postOwner: postOwner[i].value,
                postOwnerName: postOwnerName[i].value,
                commenterId: commenterId[i].value
            }
                  
            content[i].value = "";
        }
        let div = document.createElement("div");
        div.classList.add("comments");
        div.innerHTML = `<a href="/profile/${comment.commenterId}" class='commentOwner'> ${comment.name} </a><br>
        <p class='commentContent'> ${comment.content} </p>`;
        commentDiv[i].appendChild(div);
        socket.emit("comment", comment);
        console.log(comment.commenterId);
    });
};

socket.on('comment',function(comment){
    console.log("realtime comment received");
    console.log(socket.connected);
    const postId = $(".postId").val();
    console.log(postId);
    if(postId==comment.postId){
        let commentDiv = document.querySelectorAll("div.comment");
        for(let i=0; i<post.length; i++){
        let div = document.createElement("div");
        div.classList.add("comments");
        div.innerHTML = `<a href="/profile/${comment.commenterId}" class='commentOwner'> ${comment.name} </a><br>
        <p class='commentContent'> ${comment.content} </p>`;
        commentDiv[i].appendChild(div);
        };
    };
    });



