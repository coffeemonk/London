$(function () {
    'use strict';
    player(false);

    document.addEventListener('swup:contentReplaced', event => {
        $(function() {
            player(true); // reattach player
        });
    });
});

const enumPlayState = {
    PLAYING: "playing",
    PAUSED: "paused",
    LOADING: "loading"
}

// global vars (preserve for reattach)
var currentTime = 0;
var currentId = 0;
var playState = enumPlayState.PAUSED
var $player, $playerAudio, $episode, timeListener;

function player(reattach) {
    'use strict';

    $player             = $('.audioPlayer');
    $player.isExternal  = $player.hasClass('external');
    $player.speed       = 1;
                          // if NOT external, episode is player, otherwise if currentId, then load that episode
    $episode            = !$player.isExternal ? $player : ((!!currentId) ? $('.episode[data-id="' + currentId + '"]') : null);

    $playerAudio        = $player.find('audio');

    var $playerProgress = $player.find('.progress');
    var $playerTime = {
        current: $player.find('.time .current'),
        duration: $player.find('.time .duration')
    }

    if (reattach) {
        if ($player.isExternal && playState == enumPlayState.PLAYING) {
            html.addClass('player-opened');
        }
        // If the episode we were playing is available on this page
        if (!!currentTime && ($player.isExternal || $player.data('id') == currentId)) {

            $playerAudio[0].currentTime = currentTime;
            $playerTime.current.text(formatTime(currentTime));

            if ($player.isExternal) {
                updateExternalPlayer($episode, currentId);
            }
            if (playState == enumPlayState.PLAYING) {
                if (!$playerAudio.attr('src')) {
                    $playerAudio.attr('src', $episode.data('url'));
                }
                togglePlayback();
            }
        }
        reattach = false;
    } else {
        // zero out player display
        currentTime = 0;
        $playerTime.current.text(formatTime(0));
    }

    // TODO: Store current time by episode (id) in local storage, for preserving between sessions
    // TODO: Story playState with episode (id) in local storage, for preserving playState between feed/episode page

    $('.js-play').on('click', function () {
        var clickedId, clickedUrl;
        var $clicked = jQuery(this);                        // the clicked button

        if ($episode) {                                     // if we have an active episode
            $episode.data('currentTime', currentTime);      // update active episode's current time
        }
        if (!$episode || $player.isExternal) {              // we need to identify the clicked episode
            var $clickedEpisode = $clicked.closest('.episode'); // find the parent episode (if any)
            if ($clickedEpisode.length == 1) {
                $episode = $clickedEpisode;                 // episode found and set
            }
        }
        if (!!$episode) {
            clickedId = $episode.data('id');
            clickedUrl = $episode.data('url');

            // initialize player
            if (clickedId !== currentId && !!clickedUrl) {
                currentId = clickedId;                              // update currentId

                // button state updates
                $player.addClass(enumPlayState.LOADING);            // set $player to "loading"
                $episode.addClass(enumPlayState.LOADING);           // set episode to "loading"
                $('.episode').removeClass(enumPlayState.PLAYING)    // Reset all episodes' play states

                // setup player
                currentTime = $episode.data('currentTime') || 0;    // set currentTime
                $playerAudio.attr('src', clickedUrl);               // set player URL

                updateExternalPlayer();                             // update External Player
            }

            // open external player
            if ($player.isExternal) {
                html.addClass('player-opened');
            }

            togglePlayback();
        }
    });

    $playerAudio.on('loadedmetadata', function () {
        // remove timeListener
        $playerAudio[0].removeEventListener('timeupdate', timeListener);

        // update displayed duration
        var duration = $playerAudio[0].duration
        $playerTime.duration.text(formatTime(duration));

        // set playhead position and update display
        $playerAudio[0].currentTime = ($episode.data('currentTime')) ? ($episode.data('currentTime') - 1) : currentTime;
        // $playerTime.current.text(formatTime(currentTime));

        // add timeListener
        timeListener = $playerAudio[0].addEventListener('timeupdate', function (e) {
            currentTime = e.target.currentTime;                 // preserve episode currentTime
            $playerTime.current.text(formatTime(currentTime));  // update displayed time
            $playerProgress.css(
                'width',
                (currentTime / duration) * 100 + '%'
            );
        });
    });
    $player.find('.button.backward').on('click', function () {
        $playerAudio[0].currentTime = $playerAudio[0].currentTime - 10;
    });
    $player.find('.button.forward').on('click', function () {
        $playerAudio[0].currentTime = $playerAudio[0].currentTime + 30;
    });
    var $speedButton = $player.find('.button.speed');
    $speedButton.on('click', function () {
        if ($player.speed < 2) {
            $player.speed += 0.5;
        } else {
            $player.speed = 1;
        }

        $playerAudio[0].playbackRate = $player.speed;
        $speedButton.text($player.speed + 'x');
    });
    $player.find('.button.close').on('click', function() {
        togglePlayback(pause = true);
        html.removeClass('player-opened');
    });
}

function updateExternalPlayer() {
    if ($player.isExternal) {
        var $playerThumbnail    = $player.find('.post-image');
        var $playerTitle        = $player.find('.post-header .title .link');
        var $playerMeta         = $player.find('.post-header .meta');

        // Change player thumbnail
        var episodeThumb = $episode.find('.post-image').data('srcset');
        if (!!episodeThumb) {
            $playerThumbnail.attr('data-srcset', episodeThumb);
            lazySizes.loader.unveil($playerThumbnail[0]);
        }

        // Change player title
        var episodeTitle = $episode.find('.link').text();
        if (!!episodeTitle) {
            $playerTitle.text(episodeTitle);
        }

        // Change player meta
        var episodeMeta = $episode.find('.meta').html();
        if (!!episodeMeta) {
            $playerMeta.html(episodeMeta);
        }
    }
}
function togglePlayback(pause = false) {
    var $audio = $playerAudio[0]
    if (!!$audio) {
        if (pause || !$audio.paused) {
            // pause audio playback
            $audio.pause();
            playState = null;
            $('.'+enumPlayState.PLAYING).removeClass(enumPlayState.PLAYING);
        } else {
            // start audio playback
            var playPromise = $audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(function () {
                        playState = enumPlayState.PLAYING       // preserve playState for reattach
                        $player.addClass(playState);            // set $player to "playing"
                        if ($player.isExternal) {
                            $episode.addClass(playState);       // set episode to "playing"
                        }
                        $('.'+enumPlayState.LOADING).removeClass(enumPlayState.LOADING);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            }
        }
    }
}
function formatTime(currTime) {
    return new Date(currTime * 1000).toISOString().substr(11, 8);
}
