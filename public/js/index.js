$(function () {
    $.fn.extend({
        animateCss: function (animationName, callback) {
            var animationEnd = (function (el) {
                var animations = {
                    animation: 'animationend',
                    OAnimation: 'oAnimationEnd',
                    MozAnimation: 'mozAnimationEnd',
                    WebkitAnimation: 'webkitAnimationEnd',
                };

                for (var t in animations) {
                    if (el.style[t] !== undefined) {
                        return animations[t];
                    }
                }
            })(document.createElement('div'));

            this.addClass('animated ' + animationName).one(animationEnd, function () {
                $(this).removeClass('animated ' + animationName);

                if (typeof callback === 'function')
                    callback();
            });

            return this;
        },
    });


    const socket = io()
    socket.on('tweet', tweet => {
        const newItem = `<div class="col-md-12">
            <div class="tweet slow">
                <div class="tweet-head">
                    <div class="tweet-image">
                    <img src="${tweet.image}" alt="avatar" />
                    </div>
                    <div class="tweet-author">
                    <div class="name ${(tweet.verified) ? 'name-verified' : ''}">${tweet.name}</div>
                    <div class="handle">@${tweet.username}</div>
                    </div>
                </div>
                <div class="tweet-body">
                    <p id="tweet-text">${tweet.text}</p>
                    <div class="date">${tweet.date}</div>
                </div>
            </div>
        </div>`;

        addNewItem(newItem)
    })

    function addNewItem(item) {
        $('#tweets').prepend(item)
        $('.tweet').first().animateCss('bounceIn')
    }


    const tags = []

    $('#btn-topic').click(function () {
        const value = $('#topic').val()
        const tag = `<span class="tag">${value}</span>`

        $('#topic').val('')
        tags.push(value)
        $('.tags').prepend(tag)

        socket.emit('startStream', value)
    })
}) 