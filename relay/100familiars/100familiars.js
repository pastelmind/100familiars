(function () {
    'use strict';

    /**
     * @file Client-side code for 100familiars
     */
    /**
     * Opens a new popup.
     * @param url URL to open
     * @param left Position of the popup relative to the screen
     * @param top Position of the popup relative to the screen
     * @param width Pixels
     * @param height Pixels
     */
    function openPopup(url, left, top, width, height) {
        const popupWindow = open(url, "_blank", `left=${left},top=${top},width=${width},height=${height}`);
        if (!popupWindow) {
            throw new Error(`Cannot obtain handle to popup window for ${url}`);
        }
        // Resize the popup immediately instead of waiting until the page loads
        popupWindow.resizeTo(width, height);
    }
    $(() => {
        // Set up popups on familiar description links
        $(".popup-link").on("click", function (e) {
            if (!(e.currentTarget instanceof HTMLAnchorElement)) {
                console.error("%o is not an anchor", e.currentTarget);
                return;
            }
            e.preventDefault();
            openPopup(e.currentTarget.href, e.screenX, e.screenY, 400, 300);
        });
        $(".familiars").DataTable();
    });

}());
