export const div = (props, ...children) => createElement("div", props, ...children);
// const ul = (props, ...children) => createElement("ul", props, ...children);
// const li = (props, ...children) => createElement("li", props, ...children);
// const i = (props, ...children) => createElement("i", props, ...children);
// const span = (props, ...children) => createElement("span", props, ...children);
// const header = (props, ...children) =>
//   createElement("header", props, ...children);
// const p = (props, ...children) => createElement("p", props, ...children);
// const section = (props, ...children) =>
//   createElement("section", props, ...children);
// const button = (props, ...children) =>
//   createElement("button", props, ...children);

export function appendChildren(parent, children) {
  for (let child of children) {
    if (!child) continue;
    switch (typeof child) {
      case "string":
        throw "HUH"; // TODO remove
        const el = document.createTextNode(child);
        parent.appendChild(el);
        break;
      default:
        parent.appendChild(child);
        break;
    }
  }
}

export function setStyle(el, style) {
  if (typeof style == "string") {
    throw "HUH2"; // TODO remove
    el.setAttribute("style", style);
  } else {
    Object.assign(el.style, style);
  }
}

export function setClass(el, className) {
  className.split(/\s/).forEach((element) => {
    if (element) {
      el.classList.add(element);
    }
  });
}

export function setProps(el, props) {
  const eventRegex = /^on([a-z]+)$/i;
  for (let propName in props) {
    if (!propName) continue;

    if (propName === "style") {
      setStyle(el, props[propName]);
    } else if (propName === "className") {
      setClass(el, props[propName]);
    } else if (eventRegex.test(propName)) {
      const eventToListen = propName.replace(eventRegex, "$1").toLowerCase();
      el.addEventListener(eventToListen, props[propName]);
    } else {
      el.setAttribute(propName, props[propName]);
    }
  }
}

//type, [props], [...children]
export function createElement(type, props, ...children) {
  if (typeof type === "function") {
    return type(props);
  } else {
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
