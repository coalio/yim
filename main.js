// Set to whatever you want
const BACKGROUND_IMAGE = "https://i.redd.it/kgqo26pqkik41.jpg";

(function () {
    /*
    * Here we define some utility functions
    */

    /** waitForDomElement
    * @param {string} selector - The selector to use to find the element
    * @param {function} callback - The callback to call when the element is found
    * @param {number} [maxTries=10] - The maximum number of times to try to find the element
    * @param {number} [interval=100] - The interval between tries
    */
    function waitForDomElement(selector, callback, maxIntervals, interval) {
        if (!maxIntervals) maxIntervals = 20;
        if (!interval) interval = 1000;
        if (maxIntervals < 1) return;

        var element = document.querySelector(selector);
        if (element) {
          callback(element);
        } else {
          setTimeout(function () {
            waitForDomElement(selector, callback, maxIntervals - 1, interval);
          }, interval);
        }
    }


    /*
     * Second section: Background
     * We gotta set the background every time it changes
     * Sadly Angular refuses to communicate with us so we have to use
     * a dirty hack
     */
    setInterval(function () {
        waitForDomElement(
            "img.ytmusic-fullbleed-thumbnail-renderer",
            function (image) {
                // Set the background
                console.log("this is the fucking image: ", image)
                image.src = BACKGROUND_IMAGE;

                if (document.querySelector("#background-style")) return;

                // We also have to unset the background for the ::after and ::before pseudo-elements of
                // ytmusic-fullbleed-thumbnail-renderer
                // For this we have to append a style tag to the head temporarily
                const style = document.createElement("style");
                style.innerHTML = `ytmusic-fullbleed-thumbnail-renderer::after, ytmusic-fullbleed-thumbnail-renderer::before {
                                    background: none !important;
                                   }`;

                style.id = "background-style";
                document.head.appendChild(style);
            }
          );
    }, 1000);


    /*
     * This section takes care of adding the speed controls
     */
    let playbackSpeed = 1;

    const log = console.log.bind(console);
    log("running");

    function applySpeed() {
      if (!v) return;
      v.playbackRate = playbackSpeed;
    }

    function storeSpeed(speed) {
     // GM_setValue("speed", speed);
      if (s) {
        s.textContent = playbackSpeed.toFixed(2) + "x";
      }
    }

    function signBtn(sign, fnc) {
      const btn = document.createElement("p");
      btn.style.fontWeight = "bold";
      btn.style.fontSize = "4em";
      btn.style.margin = "0.2em 0.4em";
      btn.style.cursor = "pointer";
      btn.textContent = sign;
      btn.onclick = fnc;

      return btn;
    }

    let v;
    let s;

    function adjRate(amount) {
      storeSpeed(parseFloat((playbackSpeed + amount).toFixed(10), 10));
      applySpeed();
    }

    function registerBar() {
      waitForDomElement("#left-controls", function (bar) {
        // registerBar callback

        if (!bar) {
          return alert(
            "yt music playback speed had an error while initializing: register couldnt find bar"
          );
        }

        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";

        s = document.createElement("p");
        s.style.fontSize = "2em";
        storeSpeed(playbackSpeed);

        div.append(
          signBtn("-", (e) => {
            e.preventDefault();
            e.stopPropagation();
            adjRate(e.shiftKey ? -0.01 : -0.1);
          })
        );
        div.append(s);
        div.append(
          signBtn("+", (e) => {
            e.preventDefault();
            e.stopPropagation();
            adjRate(e.shiftKey ? 0.01 : 0.1);
          })
        );

        bar.append(div);
        // registerBar callback
      });
    }

    function register() {
      v = document.querySelector("video");

      v.addEventListener("ratechange", (e) => {
        // if yt decides to mess with the script then don't let it lol
        if (v.playbackRate !== playbackSpeed) {
          // prevent loops
          applySpeed();
        }
      });

      v.addEventListener("loadeddata", (e) => {
        applySpeed();
      });

    }

    const intv = setInterval(() => {
      if (!document.querySelector("video")) return; // didn't load yet

      // We run this constantly because YT loves unmounting the video element
      register();
    }, 100);

    registerBar();

    /*
     * Last section: Styles
     * Here we add some styles to the page
     */
    var style = document.createElement("style");
    style.innerHTML = `
            html {
                --ytmusic-content-width: calc( 100vw - var(--ytmusic-scrollbar-width) - 112px - 250px ) !important;
                --ytmusic-search-border: white !important;
                --ytmusic-search-background: rgba(0, 0, 0, 0.6) !important;
            }

            body {
                overflow-x: hidden !important;
            }

            yt-page-navigation-progress {
                z-index: 110;
            }

            ytmusic-pivot-bar-renderer {
                height: fit-content;
            }

            .content-container-wrapper.ytmusic-immersive-header-renderer {
                background: none !important;
                padding-top: 0 !important;
            }

            .gradient-container.ytmusic-immersive-header-renderer {
                background: none !important;
            }

            ytmusic-fullbleed-thumbnail-renderer::before {
                display: block;
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 1;
            }

            ytmusic-fullbleed-thumbnail-renderer::after {
                background: linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%) !important;
                z-index: 2;
            }

            ytmusic-fullbleed-thumbnail-renderer::before, ytmusic-fullbleed-thumbnail-renderer::after {
                display: block;
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                transition: background 0.5s ease;
            }

            .center-content ytmusic-pivot-bar-renderer {
                flex-direction: column;
                margin-top: 25px;
            }

            .background-gradient {
                background-image: linear-gradient(
                    to right,rgba(0,0,0,0.6),var(--ytmusic-background)
                ) !important;
            }

            ytmusic-fullbleed-thumbnail-renderer {
                position: fixed !important;
                height: 100vh !important;
                width: 100vw !important;
            }

            ytmusic-player-page {
                margin-left: 250px;
                width: var(--ytmusic-content-width) !important;
                top: 0 !important;
            }

            ytmusic-player-bar {
                z-index: 100 !important;
            }

            .thumbnail-image-wrapper.ytmusic-player-bar {
                display: none;
            }

            #mini-guide-background {
                display: none;
            }

            #nav-bar-background {
                display: none;
            }

            #content-wrapper {
                overflow-y: scroll;
                height: calc(100vh - 65px);
            }

            #content-wrapper::-webkit-scrollbar {
                display: none;
            ]

            body {
                overflow-y: hidden;
            }

            html {
                overflow: visible;
            }

            ytmusic-nav-bar {
                border-bottom: 1px solid #ffffff15;
                width: 100%;
            }
        `;

    document.head.appendChild(style);

    setInterval(
        waitForDomElement("body", function (bodyElement) {
            bodyElement.style.overflowY = "hidden"
        })
    , 1000)
})();
