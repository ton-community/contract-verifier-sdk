export const div = (props, ...children) =>
  createElement("div", props, ...children);
export const code = (props, ...children) =>
  createElement("code", props, ...children);
export const img = (props, ...children) =>
  createElement("img", props, ...children);

export function appendChildren(parent, children) {
  for (const child of children) {
    if (!child) continue;
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

export function setStyle(el, style) {
  if (typeof style === "string") {
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
  for (const propName in props) {
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
