"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeFolder = exports.TreeFile = void 0;
const dom_1 = require("./dom");
const file_white_svg_1 = __importDefault(require("./res/file-white.svg"));
const file_black_svg_1 = __importDefault(require("./res/file-black.svg"));
const folder_closed_white_svg_1 = __importDefault(require("./res/folder-closed-white.svg"));
const folder_closed_black_svg_1 = __importDefault(require("./res/folder-closed-black.svg"));
const folder_open_white_svg_1 = __importDefault(require("./res/folder-open-white.svg"));
const folder_open_black_svg_1 = __importDefault(require("./res/folder-open-black.svg"));
const index_1 = require("./index");
const icons = {
    dark: {
        file: file_white_svg_1.default,
        folder: {
            open: folder_open_white_svg_1.default,
            closed: folder_closed_white_svg_1.default,
        },
    },
    light: {
        file: file_black_svg_1.default,
        folder: {
            open: folder_open_black_svg_1.default,
            closed: folder_closed_black_svg_1.default,
        },
    },
};
const svgToInline = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
const TreeFile = ({ name }, theme) => {
    return (0, dom_1.div)({ className: `${index_1.classNames.FILE} ${index_1.classNames.TREE_ITEM}` }, (0, dom_1.img)({
        src: svgToInline(icons[theme].file),
    }), (0, dom_1.div)(null, name));
};
exports.TreeFile = TreeFile;
function changeOpened(theme, event) {
    const folderHeader = event.target.classList.contains("folder-header")
        ? event.target
        : event.target.parentElement;
    const opened = folderHeader.getAttribute("opened") == "true";
    const newOpened = !opened;
    folderHeader.children[0].attributes.src.value = svgToInline(newOpened ? icons[theme].folder.open : icons[theme].folder.closed);
    try {
        const sibling = folderHeader.nextElementSibling;
        if (newOpened) {
            sibling.classList.remove("hide");
        }
        else {
            sibling.classList.add("hide");
        }
    }
    catch (e) {
        console.warn(`No sibling of elem ${folderHeader} found ...`);
    }
    folderHeader.setAttribute("opened", newOpened);
}
const TreeFolder = (props, theme, ...children) => {
    const opened = props.opened || false;
    const folderIcon = icons[theme].folder[opened ? "open" : "closed"];
    const folderName = props.name || "unknown";
    return (0, dom_1.div)({ className: index_1.classNames.FOLDER_CONTAINER }, (0, dom_1.div)({
        onClick: changeOpened.bind(this, theme),
        className: `folder-header ${index_1.classNames.FOLDER} ${index_1.classNames.TREE_ITEM}`,
        opened: opened,
    }, (0, dom_1.img)({
        src: svgToInline(folderIcon),
    }), (0, dom_1.div)(null, folderName)), (0, dom_1.div)({ className: `${opened ? "" : "hide"} folder-content` }, ...children));
};
exports.TreeFolder = TreeFolder;
//# sourceMappingURL=file-structure.js.map