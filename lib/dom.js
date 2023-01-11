"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createElement = exports.setProps = exports.setClass = exports.setStyle = exports.appendChildren = exports.img = exports.code = exports.div = void 0;
const div = (props, ...children) => createElement("div", props, ...children);
exports.div = div;
const code = (props, ...children) => createElement("code", props, ...children);
exports.code = code;
const img = (props, ...children) => createElement("img", props, ...children);
exports.img = img;
function appendChildren(parent, children) {
    for (let child of children) {
        if (!child)
            continue;
        switch (typeof child) {
            case "string":
                const el = document.createTextNode(child);
                parent.appendChild(el);
                break;
            default:
                parent.appendChild(child);
                break;
        }
    }
}
exports.appendChildren = appendChildren;
function setStyle(el, style) {
    if (typeof style == "string") {
        el.setAttribute("style", style);
    }
    else {
        Object.assign(el.style, style);
    }
}
exports.setStyle = setStyle;
function setClass(el, className) {
    className.split(/\s/).forEach((element) => {
        if (element) {
            el.classList.add(element);
        }
    });
}
exports.setClass = setClass;
function setProps(el, props) {
    const eventRegex = /^on([a-z]+)$/i;
    for (let propName in props) {
        if (!propName)
            continue;
        if (propName === "style") {
            setStyle(el, props[propName]);
        }
        else if (propName === "className") {
            setClass(el, props[propName]);
        }
        else if (eventRegex.test(propName)) {
            const eventToListen = propName.replace(eventRegex, "$1").toLowerCase();
            el.addEventListener(eventToListen, props[propName]);
        }
        else {
            el.setAttribute(propName, props[propName]);
        }
    }
}
exports.setProps = setProps;
function createElement(type, props, ...children) {
    if (typeof type === "function") {
        return type(props);
    }
    else {
        const el = document.createElement(type);
        if (props && typeof props === "object") {
            setProps(el, props);
        }
        if (children) {
            appendChildren(el, children);
        }
        return el;
    }
}
exports.createElement = createElement;
//# sourceMappingURL=dom.js.map