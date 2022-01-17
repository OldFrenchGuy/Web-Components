/**
 * Resize Image Web Component
 */

class ResizeImageElement extends HTMLImageElement {
    constructor() {
        super();
    }

    static get observedAttributes() { return ['x']; }

    attributeChangedCallback() {
        this.positionResizeHandlers();
    }

    connectedCallback() {
        console.log("UImage connectedCallback ");
        // Init style and tabindex attribute in order to get the onblur event
        this.style.cursor = 'pointer';
        this.setAttribute('tabindex', 1000);
        // set image click and blur events
        this.onclick = (e) => this.click(e);
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
        this.removeResizeHandlers();
    }

    addResizeHandlers() {
        this.$rightHandler = document.createElement('div');
        this.$rightHandler.setAttribute('style', 'width: 10px; height: 10px; border: 1px solid black;  background-color: white; position: absolute;');
        this.$rightHandler.style.cursor = 'grab';
        this.$rightHandler.dataset.resize = 'right';

        this.$leftHandler = this.$rightHandler.cloneNode();
        this.$leftHandler.dataset.resize = 'left';

        this.positionResizeHandlers();

        this.parentNode.insertBefore(this.$rightHandler, this.nextSibling);
        this.parentNode.insertBefore(this.$leftHandler, this.nextSibling);
    }

    positionResizeHandlers() {
        this.$rightHandler.style.left = (window.scrollX + this.x + this.width - 8) + 'px';
        this.$leftHandler.style.left = (window.scrollX + this.x - 1) + 'px';
        this.$rightHandler.style.top = this.$leftHandler.style.top = (window.scrollY + this.y + this.height - 8) + 'px';
    }

    removeResizeHandlers() {
        if (this.$rightHandler) this.$rightHandler.remove();
        if (this.$leftHandler) this.$leftHandler.remove();
    }

    click(e) {
        this.style.cursor = 'move';
        this.$ratio = this.width / this.height;

        // create and add the resize handlers, and set mousedown event on them
        this.addResizeHandlers();
        this.$rightHandler.onpointerdown = (e) => { this.resizeMouseDown(e) };
        this.$leftHandler.onpointerdown = (e) => { this.resizeMouseDown(e) };
    }

    blur(e) {
        this.style.cursor = 'pointer';
        this.removeResizeHandlers();
    }

    resizeMouseDown(e, leftright) {
        this.$rightHandler.style.cursor = this.$leftHandler.style.cursor = 'grabbing';
        // set resize variables
        this.$x = this.x;
        this.$ex = e.x;
        this.$oWidth = this.width;
        this.$xw = this.x + this.width;
        // set capture event handlers
        e.target.onpointermove = (e) => { this.resizeMouseMove(e) };
        e.target.onpointerup = (e) => { this.resizeMouseUp(e) };
        e.target.setPointerCapture(e.pointerId);
        // avoid to move image instead
        e.stopPropagation(); e.preventDefault();
    }

    resizeMouseUp(e) {
        this.$rightHandler.style.cursor = this.$leftHandler.style.cursor = 'grab';
        // remove capture events
        e.target.onpointermove = e.target.onpointerup = null;
        e.target.releasePointerCapture(e.pointerId);
    }

    resizeMouseMove(e) {
        let coef = this.x != this.$x && this.x + this.width != this.$xw ? 2 : 1; // in case of centered image
        let delta = e.target.dataset.resize == 'right' ? e.x - this.$ex : this.$ex - e.x;
        let newWidth = this.$oWidth + delta * coef;
        this.resizeImage(newWidth);
    }

    resizeImage(newWidth) {
        if (newWidth >= 20) {
            let newHeight = newWidth / this.$ratio;
            if (newWidth <= this.$parentWidth && newHeight <= this.$parentHeight) {
                this.width = newWidth; this.height = newHeight;
                this.positionResizeHandlers();
            }
        }
    }
}

/**
 * Derived class to add some basic controls
 */
class CtlResizeImage extends ResizeImageElement {

    static get observedAttributes() { return ['width', 'height', 'src']; }

    attributeChangedCallback() {
        this.showInfos();
    }

    showInfos() {
        document.getElementById('txtwidth').value = this.width;
        document.getElementById('txtheight').value = this.height;
        document.getElementById('txtsrc').innerText = this.src;
    }

    click(e) {
        super.click(e);
        this.showInfos();
        let ctls = document.querySelectorAll('.txtpercent');
        ctls.forEach((el) => {
            el.addEventListener('click', (e) => { this.resizePercentage(e) })
        });
    }

    blur(e) {
        if (e.target == this) return;

        super.blur(e);
        document.getElementById('txtwidth').value = '';
        document.getElementById('txtheight').value = '';
        document.getElementById('txtsrc').innerText = '';
        document.getElementById('txtpercent').onclick = null;
    }

    resizeMouseUp(e) {
        super.resizeMouseUp(e);
        this.refreshImageResolution();
    }

    refreshImageResolution() {
        const parts = this.src.split('/');
        const len = parts.length;
        parts[len - 2] = this.width;
        parts[len - 1] = this.height;
        this.src = parts.join('/');
    }

    resizePercentage(e) {
        let percent = e.srcElement.dataset.percent;
        super.resizeImage(this.width * percent);
        this.refreshImageResolution();
    }
}

window.customElements.define('resize-image', ResizeImageElement, { extends: 'img' });
window.customElements.define('ctlresize-image', CtlResizeImage, { extends: 'img' });
