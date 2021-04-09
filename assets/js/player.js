$(function () {
    'use strict';
    player();

    document.addEventListener('swup:contentReplaced', event => {
        $(function() {
            player(true); // reattach player
        });
    });
});

// global vars
var currentTime, currentId, playerPaused, playerPlaying;

function player(reattach) {
    'use strict';

    var reattachPlayer = reattach || false;

    var player          = $('.audioPlayer');
    var playerAudio     = player.find('audio');

    var playerExternal  = player.hasClass('external');
    var playerOpen      = html.hasClass('player-opened');
    var playerSpeed     = 1;

    var playerThumbnail = player.find('.post-image');
    var playerTitle     = player.find('.post-header .title .link');
    var playerMeta      = player.find('.post-header .meta');
    var playerProgress  = player.find('.progress');
    var playerTime = {
        current: player.find('.time .current'),
        duration: player.find('.time .duration')
    }

    var backButton      = player.find('.button.backward');
    var forwardButton   = player.find('.button.forward');
    var speedButton     = player.find('.button.speed');
    var closeButton     = player.find('.button.close');

    if (reattachPlayer) {
        console.log('reattach');
        if (playerExternal && playerPlaying && !playerOpen) {
            console.log('open external player');
            html.addClass('player-opened');
        } else if (!playerExternal && playerOpen) {
            console.log('close external player');
            html.removeClass('player-opened');
        }

        if (!!currentTime && (playerExternal || player.data('id') == currentId)) {
            playerTime.current.text(formatTime(currentTime));
            playerAudio[0].currentTime = currentTime;
            if (playerExternal) {
                var episode = $('.episode[data-id="' + currentId + '"]');
                updateExternalPlayerDisplay(episode);
            }
            if (playerPlaying) {
                if (!playerAudio.attr('src')) {
                    playerAudio.attr('src', $('.episode[data-id="' + currentId + '"]').data('url'));
                }
                play(currentId);
            }
        }
        reattachPlayer = false;
    } else {
        // zero out player display
        currentTime = 0;
        playerTime.current.text(formatTime(0));
    }

    $('.js-play').on('click', function () {

        var clicked = jQuery(this);                 // the clicked button
        var episode = clicked.closest('.episode');  // the parent episode (if any)
        var clickedUrl, clickedId;

        // determine what to play
        if (!!episode.length) {
            // specific episode button clicked
            clickedId   = episode.data('id');
        } else {
            // external player button clicked
            if (!!currentId) {
                // currentId is set
                clickedId   = currentId;
                episode     = $('.episode[data-id="' + clickedId + '"]');
            } else {
                // no currentId set
                console.log('No episode to play...');
            }
        }
        clickedUrl = episode.data('url');

        // setup player with new episode info
        if (clickedId !== currentId) {
            clicked.find('i.fa').hide();
            clicked.find('i.loader').show();
            // Change player url
            if (!!clickedUrl) {
                playerAudio.attr('src', clickedUrl);
            }

            // Update External Player Display
            if (playerExternal) { updateExternalPlayerDisplay(episode); }

            // Reset previous episode's buttons
            setPlayButtonState("play", currentId);
        }

        // open external player
        if (playerExternal) {
            html.addClass('player-opened');
        }

        if (!!playerAudio[0] && playerAudio[0].paused) {
            play(clickedId);
        } else {
            pause();
        }
    });
    playerAudio.on('loadedmetadata', function () {
        var duration = playerAudio[0].duration
        playerTime.duration.text(formatTime(duration));
        if (!!currentTime && (playerExternal || player.data('id') == currentId)) {
            playerAudio[0].currentTime = currentTime;
            playerTime.current.text(formatTime(currentTime));
        }
        playerAudio[0].addEventListener('timeupdate', function (e) {
            currentTime = e.target.currentTime;
            playerTime.current.text(formatTime(currentTime));
            playerProgress.css(
                'width',
                (currentTime / duration) * 100 + '%'
            );
        });
    });
    backButton.on('click', function () {
        playerAudio[0].currentTime = playerAudio[0].currentTime - 10;
    });
    forwardButton.on('click', function () {
        playerAudio[0].currentTime = playerAudio[0].currentTime + 30;
    });
    speedButton.on('click', function () {
        if (playerSpeed < 2) {
            playerSpeed += 0.5;
        } else {
            playerSpeed = 1;
        }

        playerAudio[0].playbackRate = playerSpeed;
        speedButton.text(playerSpeed + 'x');
    });
    closeButton.on('click', function() {
        if (!playerAudio[0].paused) {
            pause();
        }
        html.removeClass('player-opened');
    });

    function updateExternalPlayerDisplay(episode) {
        // Change player thumbnail
        var episodeThumb = episode.find('.post-image').data('srcset');
        if (!!episodeThumb) {
            playerThumbnail.attr('data-srcset', episodeThumb);
            lazySizes.loader.unveil(playerThumbnail[0]);
        }

        // Change player title
        var episodeTitle = episode.find('.link').text();
        if (!!episodeTitle) {
            playerTitle.text(episodeTitle);
        }

        // Change player meta
        var episodeMeta = episode.find('.meta').html();
        if (!!episodeMeta) {
            playerMeta.html(episodeMeta);
        }
    }
}

function play(playId) {
    currentId = playId
    var playerAudio = $('.audioPlayer').find('audio');
    if (!!playerAudio[0]) {
        var playPromise = playerAudio[0].play();
        if (playPromise !== undefined) {
            playPromise
                .then(function () {
                    setPlayButtonState("pause", currentId);
                    $('.loader:visible').hide();
                    $('i.fa:hidden').show();
                    playerPlaying = true;
                })
                .catch(function (error) {
                    console.log(error);
                });
        }
    }
}

function pause() {
    var playerAudio = $('.audioPlayer').find('audio');
    if (!!playerAudio[0]) {
        playerAudio[0].pause();
        setPlayButtonState("play", currentId);
        playerPlaying = false;
    }
}

function formatTime(currTime) {
    return new Date(currTime * 1000).toISOString().substr(11, 8);
}

function setPlayButtonState(state, episodeId) {
    var newState = (state == "pause") ? "pause" : "play";
    var oldState = (state == "pause") ? "play" : "pause";
    $('.audioPlayer').find('i.fa-'+oldState).removeClass('fa-'+oldState).addClass('fa-'+state);
    $('.episode[data-id="' + episodeId + '"]').find('i.fa-'+oldState).removeClass('fa-'+oldState).addClass('fa-'+state);
}
