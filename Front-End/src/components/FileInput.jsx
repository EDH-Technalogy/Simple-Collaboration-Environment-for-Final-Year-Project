import { BsUpload } from "react-icons/bs";
import React from "react";

function FileInput({
  label,
  register,
  accept,
  id,
  name,
  variants,
  onChange,
  multiple,
}) {
  return (
    <>
      <label
        htmlFor={id}
        className={`text-xs px-1 font-semibold text-gray-500 dark:text-white  ${
          variants === "secondary" ? " text-slate-600 dark:text-white " : ""
        }`}
      >
        {label}
      </label>
      <div className="relative mt-05 ">
        <label
          htmlFor={id}
          className="flex min-h-[175px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed  dark:border-gray-800 dark:hover:border-gray-700 border-primary p-6 hover:border-brand-400"
        >
          <div>
            <input
              {...register}
              accept={accept}
              type="file"
              name={name}
              id={id}
              className="sr-only"
              multiple={multiple}
              onChange={onChange}
            />
            <span className="mx-auto mb-3 flex h-[50px] w-[50px] items-center justify-center rounded-full border  border-slate-300 bg-white dark:bg-gray-500">
              <BsUpload
                size={20}
                className={` text-slate-400 dark:text-white ${
                  variants === "secondary" ? " text-slate-400" : ""
                }`}
              />
            </span>
            <span
              className={`text-base text-slate-400 dark:text-white dark:text-dark-6   ${
                variants === "secondary" ? " text-slate-400" : ""
              }`}
            >
              فایل را بکشید و رها کنید یا
              <span
                className={`text-slate-400 underline ${
                  variants === "secondary" ? " text-slate-400" : ""
                }`}
              >
                {" "}
                انتخاب کنید{" "}
              </span>
            </span>
          </div>
        </label>
      </div>
    </>
  );
}

export default FileInput;
