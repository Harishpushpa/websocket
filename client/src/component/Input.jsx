import React from "react";

export default function Input({ name, placeholder, handleInput, value }) {
  return (
    <div>
      <input
        name={name}
        value={value}
        onChange={handleInput}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  );
}
