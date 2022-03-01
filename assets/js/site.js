var html = $('html');

$(function () {
    initDarkMode();
    // initSwup();
    initMobileNav();
});
function initDarkMode() {
    // Auto Dark Mode
    var prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var savedDarkMode = localStorage.getItem('darkMode');
    setDarkMode(savedDarkMode == null ? prefersDarkScheme : savedDarkMode == 'true');

    // Dark Mode Toggle
    $('.theme-selector').click(event => {
        darkMode = html.hasClass('theme-dark');
        localStorage.setItem('darkMode', !darkMode);
        setDarkMode(!darkMode);
    });
}
function setDarkMode(darkMode = false) {
    var selector = $('.theme-selector');
    if (darkMode) {
        html.addClass('theme-dark').removeClass('theme-light');
        selector[0].title = "Click to set Light Mode"
    } else {
        html.addClass('theme-light').removeClass('theme-dark');
        selector[0].title = "Click to set Dark Mode"
    }
    html.removeClass('theme-default');
}
function initSwup() {
    // Initiate Swup transitions
    var swup = new Swup({
        plugins: [new SwupHeadPlugin(), new SwupScriptsPlugin()], // {optin: true})],
        options: {
            cache: false
        }
    });
    document.addEventListener('swup:contentReplaced', event => {
        window.scrollTo(0, 0);
        initInfiniteScroll(window, document);
        html.removeClass('site-head-open');
    });
}
function initMobileNav() {
    // Mobile Menu Trigger
    $('.nav-burger').click(function () {
        html.toggleClass('site-head-open');
    });
};

var $modalWrapper, $modal;
function showModal(title, content) {
    $modalWrapper = $('.modal-wrapper');
    $modal = $modalWrapper.find('.modal');
    $modal.find('.modal-title').html(title);
    $modal.find('.modal-content').html(content);
    $modalWrapper.show();
}

function closeModal() {
    $modalWrapper.hide();
    $modal.find('.modal-title').html('');
    $modal.find('.modal-content').html('');
}

/* Other initializations */
if ("undefined" == typeof Cove) {
    const Cove = {
        autoLoad: 1
    };
}
