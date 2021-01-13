import React, { Component } from "react";
import { Navbar } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

class Header extends Component {
    render() {
        return (
            <Navbar bg="dark" variant="dark">
                <Navbar.Brand href="#home">
                    <img src="logo.svg" style={{
                        width: "30px",
                        height: "30px"
                    }} alt="Hospital marker icon"></img> HospitalGIS
                </Navbar.Brand>
            </Navbar>
        );
    }
}

export default Header;