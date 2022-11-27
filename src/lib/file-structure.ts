import { div } from "./dom";

const File = ({ name }) => {
  return div(
    { className: "file" },
    div({ className: "material-icons", style: "opacity: 0;" }, "arrow_right"), // TODO
    div({ className: "material-icons" }, "insert_drive_file"), // TODO
    div(null, name)
  );
};

/* Folder */

const openedFolderIcon = "folder_open";
const closedFolderIcon = "folder";
const openedArrowIcon = "arrow_drop_down";
const closedArrowIcon = "arrow_right";

function changeOpened(event) {
  const folderHeader = event.target.classList.contains("folder-header")
    ? event.target
    : event.target.parentElement;
  const opened = folderHeader.getAttribute("opened") == "true";
  const newOpened = !opened;

  let icons = folderHeader.querySelectorAll(".material-icons");
  icons.forEach((icon) => {
    if (/arrow/i.test(icon.textContent)) {
      icon.textContent = newOpened ? openedArrowIcon : closedArrowIcon;
    } else {
      icon.textContent = newOpened ? openedFolderIcon : closedFolderIcon;
    }
  });

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

const Folder = (props, ...children) => {
  const opened = props.opened || false;
  const arrowIcon = opened ? openedArrowIcon : closedArrowIcon;
  const folderIcon = opened ? openedFolderIcon : closedFolderIcon;
  const folderName = props.name || "unknown";

  return div(
    { className: "folder" },
    div(
      {
        onClick: changeOpened,
        className: "folder-header",
        opened: opened,
      },
      div({ className: "material-icons" }, arrowIcon),
      div({ className: "material-icons" }, folderIcon),
      div(null, folderName)
    ),
    div({ className: opened ? "" : "hide" }, ...children)
  );
};
