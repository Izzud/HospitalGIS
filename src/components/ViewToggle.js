import PropTypes from "prop-types";
import React, { Component } from "react";

import "./../css/toggleButton.css";

export class ViewToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { selected, toggleSelected } = this.props;
    return (
      <div className="toggle-container" onClick={toggleSelected}>
        <div className={`dialog-button ${selected === "cases" ? "" : "disabled"}`}>
          {selected === "cases" ? "Cases" : "Capacity"}
        </div>
      </div>
    );
  }
}

ViewToggle.propTypes = {
  selected: PropTypes.string.isRequired,
  toggleSelected: PropTypes.func.isRequired
}