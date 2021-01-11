import React, { Component } from "react";
import { Navbar } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

class Header extends Component {
    render() {
        return (
            <Navbar bg="dark" variant="dark">
                <Navbar.Brand href="#home">
                    HospitalGIS
                </Navbar.Brand>
            </Navbar>
        );
    }
}

export default Header;