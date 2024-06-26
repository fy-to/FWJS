import { format as formatDateTimeago } from "timeago.js";
import { useTranslation } from "./translations";
import { getLocale } from "@fy-/fws-js";

const cropText = (str: string, ml = 100, end = "...") => {
  if (str.length > ml) {
    return `${str.slice(0, ml)}${end}`;
  }
  return str;
};
const getContrastingTextColor = (backgroundColor: string) => {
  const r = parseInt(backgroundColor.substring(1, 3), 16);
  const g = parseInt(backgroundColor.substring(3, 5), 16);
  const b = parseInt(backgroundColor.substring(5, 7), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (dt: Date | string | number) => {
  let _dt = dt as number;
  if (typeof dt === "string") {
    _dt = Date.parse(dt);
    if (Number.isNaN(_dt)) {
      _dt = parseInt(dt);
    }
  }

  const translate = useTranslation();
  return translate("global_datetime", {
    val: new Date(_dt),
    formatParams: {
      val: {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    },
  });
};
const formatDatetime = (dt: Date | string | number) => {
  let _dt = dt as number;
  if (typeof dt === "string") {
    _dt = Date.parse(dt);
    if (Number.isNaN(_dt)) {
      _dt = parseInt(dt);
    }
  }
  const translate = useTranslation();
  return translate("global_datetime", {
    val: new Date(_dt),
    formatParams: {
      val: {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      },
    },
  });
};
const formatTimeago = (dt: Date | string | number) => {
  let _dt = dt as number;
  if (typeof dt === "string") {
    _dt = Date.parse(dt);
    if (Number.isNaN(_dt)) {
      _dt = parseInt(dt);
    }
  }
  return formatDateTimeago(new Date(_dt), getLocale().replace("_", "-"));
};

export {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  getContrastingTextColor,
};
