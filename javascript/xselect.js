/**
 * XSelect Web Component
 * 
 * In order to work properly, this js file MUST be implemented with async attribute , ex :
 *          <script src="xselect.js" async></script>
 * This web component needs to have in its innerHtml a single HTML web element containing a select element.
 * This web component is not shadowed, meaning CSS styles are inherited from document styles.
 * Data are either a JSON in the data-array attribute or a json response of an ajax call from the data-url attribute
 */

class XSelectElement extends HTMLElement {

    constructor() {
        super();
        this.$done = false;
    }

    connectedCallback() {
        console.log("Xselect connectedCallback " + this.$done);
        if (this.$done === true) return;
        this.$done = true;

        // Get selected options from dataset if any
        this.$selection = [];
        if (this.dataset.selected) {
            var selected = JSON.parse(this.dataset.selected);
            Object.keys(selected).map((key) => { this.$selection[key] = selected[key] });
        }
        // Get labels from dataset if any
        this.$labels = [];
        if (this.dataset.label) {
            this.$labels = Object.values(JSON.parse(this.dataset.label));
        }

        // Set added attribute on select initControls
        this.$attr = [];
        if (this.dataset.attr) {
            this.$attr = JSON.parse(this.dataset.attr);
        }


        // Get data and init controls
        this.getDataAndShow();
    }

    getDataAndShow() {
        if (this.dataset.array) {
            // Get select/options from dataset
            this.storeDataAndInitControls(this.dataset.array);
        } else if (this.dataset.url) {
            // Get select/options from ajax call
            this.callAjax(this.dataset.url);
        } else {
            // Error
            this.innerHTML = "Error : Cannot load data. Neither data-array or data_url specified. ";
        }
    }

    storeDataAndInitControls(jsondata) {
        // Extract data from JSON
        var data = Object.entries(JSON.parse(jsondata));

        // Store select/options in this object
        this.$menu = [];
        for (const [name, arr] of data) {
            this.$menu[name] = [];
            for (const [id, options] of Object.entries(arr)) {
                this.$menu[name][id] = options;
            }
        }

        // Create all select elements and fill them with defaults options
        this.initControls();

    }


    initControls() {
        var lb = 0;
        var prev_select_id = 0;
        var curSelect = 0;
        for (let menuname of Object.keys(this.$menu)) {
            // get template and clone it
            var node = this.appendChild(this.firstElementChild.cloneNode(true));
            // TODO : !!!!!!!!!!!!!!!!!!!
            // var newElem = document.getElementById('todo_item').content.cloneNode(true).firstElementChild;

            // Update the select element
            var select = node.querySelector('select');
            if (!select) return;
            select.name = menuname;
            select.id = "xselect_id_" + menuname;

            // put attributes on select controls
            for (const [attr, arr] of Object.entries(this.$attr)) {
                select.setAttribute(attr, arr[curSelect++]);
            }

            // Update the label element if any
            if (typeof (this.$labels[lb]) !== undefined) {
                var label = node.querySelector("label");
                if (label) {
                    label.setAttribute("for", select.id)
                    label.innerHTML = this.$labels[lb++];
                }
            }


            // Fill the options in it with selection if any
            var selected_id = typeof (this.$selection[menuname]) !== 'undefined' ? this.$selection[menuname] : 0;
            var currentMenu = this.$menu[menuname];
            var optkeys = Object.keys(currentMenu);
            var options = currentMenu[prev_select_id] ? currentMenu[prev_select_id] : currentMenu[optkeys[0]];
            this.fillSelectOptions(select.id, options, selected_id);

            // For the next menu of selected options
            prev_select_id = selected_id;

            // Set the onchange event
            select.addEventListener('change', this.onChangeSelect);
        }

        // Remove the initial template
        this.removeChild(this.firstElementChild);

    }

    fillSelectOptions(id, options, selected_id) {
        // Get the select element
        var s = document.getElementById(id);
        // Delete any previous options
        s.innerHTML = "";
        // fill with options and select one if any
        for (const [id, text] of Object.entries(options)) {
            var opt = document.createElement('option');
            opt.value = id;
            opt.innerHTML = text;
            if (id == selected_id) opt.selected = true;
            s.appendChild(opt);
        }
    }

    onChangeSelect() {
        var menus = this.closest('xselect-tag').$menu;

        // try to find subsequent select
        var menunames = Object.keys(menus);
        for (var i = 0; i < menunames.length && menunames[i] !== this.name; i++);
        if (++i >= menunames.length) return;

        // Fill options in the subsequent select
        var subSelectId = "xselect_id_" + menunames[i];
        var currentMenu = menus[menunames[i]];
        var optkeys = Object.keys(currentMenu);
        var options = currentMenu[this.value] ? currentMenu[this.value] : currentMenu[optkeys[0]];
        this.closest('xselect-tag').fillSelectOptions(subSelectId, options, null);

        // DispatchEvent to all subsequent select elements
        document.getElementById(subSelectId).dispatchEvent(new MouseEvent('change'));
    }

    callAjax(url) {
        var xmlhttp;
        var self = this;
        // compatible with IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                self.storeDataAndInitControls(xmlhttp.responseText);
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

}
window.customElements.define('xselect-tag', XSelectElement);
