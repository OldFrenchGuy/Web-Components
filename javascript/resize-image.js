/**
 * Resize Image Web Component
 */

class ResizeImageElement extends HTMLImageElement {
    constructor() {
        super();
    }

    connectedCallback() {
        console.log("UImage connectedCallback ");
        // Init style and tabindex attriute in order to get the onblur event
        this.style.cursor = 'pointer';
        this.setAttribute('tabindex', 1000);
        // set click and blur events
        this.$onclick = this.onclick;
        this.onclick = (e) => this.click(e);
        this.$onblur = this.onblur;
        this.onblur = (e) => this.blur(e);
        // get container max dimensions
        var container = this.closest('li,div,td');
        this.$parentWidth = container.clientWidth;  // maybe offsetWidth and height
        this.$parentHeight = container.clientHeight;
    }

    disconnectedCallback() {
        console.log("UImage DisconnectedCallback ");
        // cleanup image element
        this.style.cursor = '';
        this.removeAttribute('tabindex');
        // remove any added element and/or events, if needed
        this.blur();
        // restore document mouse (and up...) event, needed ???
        // if (this.$oldOnMouseMoveHandler) document.onmousemove = this.$oldOnMouseMoveHandler;
        // this.$oldOnMouseMoveHandler = null;

        // restore events
        this.onclick = this.$onclick;
        this.onblur = this.$onblur;
    }

    click(e) {
        // set cursor
        this.style.cursor = 'move';

        // add the resize handlers
        this.$div = document.createElement('div');
        this.$div.setAttribute('style', 'width: 10px; height: 10px; border: 1px solid black;  background-color: white; position: absolute;');
        this.$div2 = this.$div.cloneNode();

        this.$div.style.left = (window.scrollX + this.x + this.width - 8) + 'px';
        this.$div.style.top = (window.scrollY + this.y + this.height - 8) + 'px';
        this.$div2.style.left = (window.scrollX + this.x - 1) + 'px';
        this.$div2.style.top = (window.scrollY + this.y + this.height - 8) + 'px';

        this.$div.style.cursor = 'grab';
        this.$div2.style.cursor = 'grab';


        this.parentNode.insertBefore(this.$div, this.nextSibling);
        this.parentNode.insertBefore(this.$div2, this.nextSibling);

        // set resize mousedown event
        this.$div.addEventListener('mousedown', (e) => this.resizeMouseDown(e, 'right'));
        this.$div2.addEventListener('mousedown', (e) => this.resizeMouseDown(e, 'left'));
    }

    blur(e) {
        // restore cursor
        this.style.cursor = 'pointer';
        // Delete the resize handlers
        if (this.$div) this.$div.remove();
        if (this.$div2) this.$div2.remove();
    }

    resizeMouseDown(e, leftright) {
        console.log('resizeMouseDown');
        // set resize variables
        this.$resizing = leftright;
        this.$x = this.x; this.$y = this.y;
        this.$ex = e.x; this.$ey = e.y;
        this.$oWidth = this.width;
        this.$ratio = this.width / this.height;

        this.$div.style.cursor = 'grabbing';
        this.$div2.style.cursor = 'grabbing';
        this.style.cursor = 'grabbing';

        // set event handlers
        this.$oldOnMouseMoveHandler = document.onmousemove;
        document.onmousemove = (e) => this.mouseMove(e);
        this.$oldOnMouseUpHandler = document.onmouseup;
        document.onmouseup = (e) => this.mouseUp(e);

        e.stopPropagation(); e.preventDefault();
    }

    mouseUp(e) {
        if (this.$resizing) {
            // stop resizing
            this.$resizing = false;

            // restore document mousemove event
            document.onmousemove = this.$oldOnMouseMoveHandler;
            this.$oldOnMouseMoveHandler = null;
            document.onmouseup = this.$oldOnMouseUpHandler;
            this.$oldOnMouseUpHandler = null;

            this.$div.style.cursor = 'grab';
            this.$div2.style.cursor = 'grab';
            this.style.cursor = 'move';

            e.stopPropagation(); e.preventDefault();
        }
    }

    mouseMove(e) {
        if (this.$resizing) {
            // resize 
            let newWidth;
            let coef = this.x != this.$x ? 2 : 1; // in case of centered image
            if (this.$resizing == 'right') {
                newWidth = this.$oWidth + (e.x - this.$ex) * coef;
            } else {
                newWidth = this.$oWidth + (this.$ex - e.x) * coef;
            }

            if (newWidth >= 20) {
                let newHeight = newWidth / this.$ratio;
                if (newWidth <= this.$parentWidth && newHeight <= this.$parentHeight) {
                    // resize image
                    this.width = newWidth;
                    this.height = newHeight;
                    // re-pos resize handlers
                    this.$div.style.left = (window.scrollX + this.x + this.width - 8) + 'px';
                    this.$div.style.top = (window.scrollY + this.y + this.height - 8) + 'px';
                    this.$div2.style.left = (window.scrollX + this.x - 1) + 'px';
                    this.$div2.style.top = (window.scrollY + this.y + this.height - 8) + 'px';
                }
            }

            e.stopPropagation(); e.preventDefault();
        }
    }
}

/**
 * Derived class to add some controls
 */
class CtlResizeImage extends ResizeImageElement {

    static get observedAttributes() { return ['width', 'height']; }

    attributeChangedCallback() {
        this.showInfos();
    }

    showInfos() {
        document.getElementById('txtwidth').value = this.width;
        document.getElementById('txtheight').value = this.height;
    }

    click(e) {
        super.click(e);
        this.showInfos();
    }

    mouseUp(e) {
        super.mouseUp(e);

        let parts = this.src.split('/');
        let len = parts.length;
        parts[len - 2] = this.width;
        parts[len - 1] = this.height;
        this.src = parts.join('/');
    }

}
window.customElements.define('resize-image', ResizeImageElement, { extends: 'img' });
window.customElements.define('ctlresize-image', CtlResizeImage, { extends: 'img' });
