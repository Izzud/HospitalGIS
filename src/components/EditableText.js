// modified from https://medium.com/javascript-in-plain-english/editable-text-component-with-click-outside-to-close-feature-using-react-hooks-6cb6b704bd69

import React, { useState, useRef, useEffect } from "react";

const EditableInput = props => {
  // We use hooks to declare "initial" states
  const inputRef = useRef(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [text, setText] = useState(props.text);
  const updateHandler = props.updateHandler;
  const fieldName = props.fieldName;

  function onClickOutSide(e) {
    // Check if user is clicking outside of <input>
    if (inputRef.current && !inputRef.current.contains(e.target)) {
      setInputVisible(false); // Disable text input
    //   console.log(text);
      updateHandler(text, fieldName);
    }
  }

  useEffect(() => {
    // Handle outside clicks on mounted state
    if (inputVisible) {
      document.addEventListener("mousedown", onClickOutSide);
    }

    // This is a necessary step to "dismount" unnecessary events when we destroy the component
    return () => {
      document.removeEventListener("mousedown", onClickOutSide);
    };
  });

  return (
    <React.Fragment>
      {inputVisible ? (
        <input
          ref={inputRef} // Set the Ref
          value={text} // Now input value uses local state
          onChange={e => {
            setText(e.target.value);
          }}
        />
      ) : (
        <span onClick={() => setInputVisible(true)}>{text}</span>
      )}
    </React.Fragment>
  );
};

export default EditableInput;