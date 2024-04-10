import { div, img } from "./dom";
import fileWhite from "./res/file-white.svg";
import fileBlack from "./res/file-black.svg";
import folderClosedWhite from "./res/folder-closed-white.svg";
import folderClosedBlack from "./res/folder-closed-black.svg";
import folderOpenWhite from "./res/folder-open-white.svg";
import folderOpenBlack from "./res/folder-open-black.svg";
import { classNames } from "./contract-verifier-ui";

const icons = {
  dark: {
    file: fileWhite,
    folder: {
      open: folderOpenWhite,
      closed: folderClosedWhite,
    },
  },
  light: {
    file: fileBlack,
    folder: {
      open: folderOpenBlack,
      closed: folderClosedBlack,
    },
  },
};

const svgToInline = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;

export const TreeFile = ({ name }, theme) => {
  return div(
    { className: `${classNames.FILE} ${classNames.TREE_ITEM}` },
    img({
      src: svgToInline(icons[theme].file),
    }),
    div(null, name),
  );
};

function changeOpened(theme, event) {
  const folderHeader = event.target.classList.contains("folder-header")
    ? event.target
    : event.target.parentElement;
  const opened = folderHeader.getAttribute("opened") === "true";
  const newOpened = !opened;

  folderHeader.children[0].attributes.src.value = svgToInline(
    newOpened ? icons[theme].folder.open : icons[theme].folder.closed,
  );

  try {
    const sibling = folderHeader.nextElementSibling;
    if (newOpened) {
      sibling.classList.remove("hide");
    } else {
      sibling.classList.add("hide");
    }
  } catch (e) {
    console.warn(`No sibling of elem ${folderHeader} found ...`);
  }

  folderHeader.setAttribute("opened", newOpened);
}

export const TreeFolder = (props, theme, ...children) => {
  const opened = props.opened || false;
  const folderIcon = icons[theme].folder[opened ? "open" : "closed"];
  const folderName = props.name || "unknown";

  return div(
    { className: classNames.FOLDER_CONTAINER },
    div(
      {
        onClick: changeOpened.bind(this, theme),
        className: `folder-header ${classNames.FOLDER} ${classNames.TREE_ITEM}`,
        opened,
      },
      img({
        src: svgToInline(folderIcon),
      }),
      div(null, folderName),
    ),
    div({ className: `${opened ? "" : "hide"} folder-content` }, ...children),
  );
};
