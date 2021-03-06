'use strict';

(function () {
    (function customEventPolyfill() {
        //Gives custom events function to IE11
        if (typeof window.customEvent === 'function') return false;
        function CustomEvent(event, params) {
            params = params || {
                bubbles: false,
                cancelable: false,
                detail: undefined
            };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    })();

    function fireCustomEvent(modalElement, attributeId, eventName) {
        var event = new CustomEvent(eventName, {
            bubbles: true,
            detail: {
                modal: modalElement,
                modalId: modalElement.getAttribute(attributeId)
            }
        });
        modalElement.dispatchEvent(event);
    }

    function Modal(elem) {
        this.currentElement = elem;
        this.targetId = elem.getAttribute('data-modal-id');
        this.overlay = document.getElementById(this.targetId);
        this.modalElement = document.querySelector('#' + this.targetId + ' .modal');
        this.firstCloseButton = document.querySelector('#' + this.targetId + ' [data-modal-close]');
        console.log(this.firstCloseButton);
        this.closeButtons = document.querySelectorAll('#' + this.targetId + ' [data-modal-close]');
        console.log(this.closeButtons);
        this.body = document.querySelector('body');
        this.handleEscapeKey = this.handleEscapeKey.bind(this);
        this.handleFocusTrap = this.handleFocusTrap.bind(this);
        this.allInstances.push(this);
        this.build(elem);
        this.isOpen = false;
    }

    Modal.prototype.build = function (modalLink) {
        var self = this;
        this.validateSelectors(modalLink);
        self.modalElement.setAttribute('aria-hidden', 'true');
        this.handleTabIndex(this.overlay, 'close');
        modalLink.addEventListener('click', function () {
            self.openModal();
        });
        self.initializeCloseEvents(this.closeButtons);
    };
    Modal.prototype.allInstances = [];
    Modal.prototype.openModal = function () {
        this.overlay.classList.add('open');
        this.modalElement.classList.add('active');
        this.body.classList.add('modal-open');
        document.querySelector('#' + this.targetId + ' [data-modal-close]').focus();
        document.addEventListener('keydown', this.handleFocusTrap);
        document.addEventListener('keydon', this.handleFocusTrap);
        this.handleTabIndex(this.overlay, 'open');
        this.handleScreenreaderOpen(this.modalElement);
        fireCustomEvent(this.overlay, 'id', 'modalOpen');
        this.isOpen = true;
    };
    Modal.prototype.closeModal = function () {
        document.removeEventListener('keydown', this.handleTabIndex);
        document.removeEventListener('keydown', this.handleFocusTrap);
        this.overlay.classList.remove('open');
        this.body.classList.remove('modal-open');
        this.modalElement.classList.remove('active');
        this.handleScreenreaderClose(this.modalElement);
        fireCustomEvent(this.overlay, 'id', 'modalClose');
        console.log(this.currentElement);
        this.isOpen && this.currentElement.focus();
        this.handleTabIndex(this.overlay, 'close');
        this.isOpen = false;
    };
    Modal.prototype.overlayClose = function (e) {
        if (e.srcElement === this.overlay) this.closeModal();
    };
    Modal.prototype.handleScreenreaderOpen = function (modal) {
        // hides all elements from screen reader except for open modal;
        function findAncestor(el, sel) {
            while ((el = el.parentElement) && !(el.matches || el.matchesSelector).call(el, sel)) {}
            return el;
        }
        var parentMOLO = findAncestor(modal, '.molo');
        var skipToContentLink = document.querySelectorAll('.skipnav-target');
        var noindexDivs = document.querySelectorAll('.noindex');
        var moloDivs = document.querySelectorAll('.molo');
        [].slice.call(skipToContentLink).forEach(function (a) {
            return a.setAttribute('aria-hidden', 'true');
        });
        [].slice.call(noindexDivs).forEach(function (div) {
            return div.setAttribute('aria-hidden', 'true');
        });
        [].slice.call(moloDivs).forEach(function (div) {
            return div.setAttribute('aria-hidden', 'true');
        });
        modal.removeAttribute('aria-hidden');
        parentMOLO.removeAttribute('aria-hidden');
    };

    Modal.prototype.handleScreenreaderClose = function (modal) {
        var skipToContentLink = document.querySelectorAll('.skipnav-target');
        var noindexDivs = document.querySelectorAll('.noindex');
        var moloDivs = document.querySelectorAll('.molo');
        [].slice.call(skipToContentLink).forEach(function (a) {
            return a.removeAttribute('aria-hidden');
        });
        [].slice.call(noindexDivs).forEach(function (div) {
            return div.removeAttribute('aria-hidden');
        });
        [].slice.call(moloDivs).forEach(function (div) {
            return div.removeAttribute('aria-hidden');
        });
        modal.setAttribute('aria-hidden', 'true');
    };
    Modal.prototype.validateSelectors = function (modalLink) {
        try {
            var modalId = modalLink.getAttribute('data-modal-id');
            var elem = document.querySelector('#' + modalId);
            if (!modalId) {
                throw new Error('Cannot find "data-modal-id" attribute. Make sure that you include this on your modal link element!');
            } else if (!elem) {
                throw new Error('Cannot find element with id ' + modalId + '. Make sure that you include this element on your page!');
            }
        } catch (e) {
            console.error(e);
        }
    };
    Modal.prototype.handleTabIndex = function (el, option) {
        var indices = Array.prototype.slice.call(el.querySelectorAll('a,button,input,submit'));
        indices.forEach(function (i) {
            i.tabIndex = option === 'close' ? '-1' : '0';
        });
    };
    Modal.prototype.initializeCloseEvents = function (closeButtons) {
        var _this = this;

        Array.prototype.slice.call(closeButtons).forEach(function (btn) {
            btn.addEventListener('click', _this.closeModal.bind(_this));
        });
        this.overlay.addEventListener('click', this.overlayClose.bind(this));
    };
    Modal.prototype.handleEscapeKey = function (e) {
        var escKey = 27;
        if (e.keyCode === escKey) {
            this.closeModal();
        }
    };

    Modal.prototype.handleFocusTrap = function (e) {
        var self = this;
        var allFocusableElements = Array.prototype.slice.call(self.overlay.querySelectorAll('a,button,input,submit'));
        var firstFocusableEl = allFocusableElements[0];
        var lastFocusableEl = allFocusableElements[allFocusableElements.length - 1];
        var tabKeycode = 9;
        if (e.keyCode === 'Tab' || e.keyCode === tabKeycode) {
            if (e.shiftKey) {
                /* shift + tab */
                if (document.activeElement === firstFocusableEl) {
                    lastFocusableEl.focus();
                    e.preventDefault();
                } else {
                    /* tab */
                    if (document.activeElement === lastFocusableEl) {
                        firstFocusableEl.focus();
                        e.preventDefault();
                    }
                }
            }
        }
    };

    (function init() {
        var toggleElements = document.querySelectorAll('[data-toggle="modal"]');
        Array.prototype.slice.call(toggleElements).forEach(function (modalLink) {
            new Modal(modalLink);
        });
    })();
})();