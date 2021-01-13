import React, { useState, useEffect, useRef, useCallback } from "react";
// import useSwr, { mutate } from "swr";
import useSupercluster from "use-supercluster";
import Geocoder from "react-map-gl-geocoder";
import axios from "axios";
import InteractiveMap, {
    Marker,
    Popup,
    FlyToInterpolator,
    NavigationControl,
    FullscreenControl,
    ScaleControl,
    GeolocateControl
} from "react-map-gl";
import { ViewToggle } from "./ViewToggle";
import EditableText from "./EditableText";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";

function Map() {
    const [viewport, setViewport] = useState({
        latitude: 40.167121,
        longitude: -82.828851,
        width: "100vw",
        height: "92vh",
        zoom: 3
    });

    const handleViewportChange = useCallback(
        (newViewport) => setViewport(newViewport),
        []
    );

    // if you are happy with Geocoder default settings, you can just use handleViewportChange directly
    const handleGeocoderViewportChange = useCallback(
        (newViewport) => {
            const geocoderDefaultOverrides = { transitionDuration: 1000 };

            return handleViewportChange({
                ...newViewport,
                ...geocoderDefaultOverrides
            });
        },
        [handleViewportChange]
    );

    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedViewMode, setViewMode] = useState("capacity");
    const [addMark, setAddMark] = useState(null);
    const [points, setPoints] = useState([]);
    const [newHospital, setNewHospital] = useState("");
    const mapRef = useRef();

    const url = "http://localhost:8007/hospital";

    useEffect(() => {
        const listener = e => {
            if (e.key === "Escape") {
                setSelectedHospital(null);
                setAddMark(null);
            }
        };
        window.addEventListener("keydown", listener);
        return () => {
            window.removeEventListener("keydown", listener);
        };
    });

    useEffect(() => {
        axios.get(url).then(response => {
            console.log(response);
            var hospitals = response.data;
            const pts = hospitals.map((hospital) => ({
                type: "Feature",
                properties: {
                    cluster: false,
                    hospitalID: hospital.id,
                    name: hospital.name,
                    state: hospital.state,
                    beds: (hospital.beds > 0 ? parseInt(hospital.beds) : 0),
                    covid_cases: (hospital.covid_cases > 0 ? parseInt(hospital.covid_cases) : 0),
                },
                geometry: {
                    type: "Point",
                    coordinates: [parseFloat(hospital.longitude), parseFloat(hospital.latitude)]
                }
            }))
            setPoints(pts);
        }).catch((e) => alert(e));
    }, []);


    // get total cases/capacity
    var totalCap = 0;
    var allCases = 0;

    if (points.length) {
        const accumulator = points.reduce((acc, props) => {
            acc[0] = (acc[0] || 0) + props.properties.beds;
            acc[1] = (acc[1] || 0) + props.properties.covid_cases;
            return acc;
        });

        totalCap = accumulator[0];
        allCases = accumulator[1];
    }

    // get map bounds
    const bounds = mapRef.current ? mapRef.current.getMap().getBounds().toArray().flat() : null;

    // get clusters
    var { clusters, supercluster } = useSupercluster({
        points,
        zoom: viewport.zoom,
        bounds,
        options: {
            radius: 170, maxZoom: 20,
            map: (props) => ({
                capacity: props.beds,
                totalCases: props.covid_cases
            }),
            reduce: (acc, props) => {
                acc.capacity += props.capacity;
                acc.totalCases += props.totalCases;
                return acc;
            },
        }
    });

    const geolocateStyle = {
        position: 'absolute',
        top: 62,
        left: 0,
        padding: '10px'
    };

    const fullscreenControlStyle = {
        position: 'absolute',
        top: 36 + geolocateStyle.top,
        left: 0,
        padding: '10px'
    };

    const navStyle = {
        position: 'absolute',
        top: 72 + geolocateStyle.top,
        left: 0,
        padding: '10px'
    };

    const scaleControlStyle = {
        position: 'absolute',
        bottom: 23,
        left: 0,
        padding: '10px'
    };

    const handleUpdate = (newData, fieldName) => {
        const cases = (fieldName === 'cases' ? newData : selectedHospital.properties.covid_cases)
        const beds = (fieldName === 'beds' ? newData : selectedHospital.properties.beds)

        const id = selectedHospital.properties.hospitalID

        const toSend = {
            name: selectedHospital.properties.name,
            beds: parseInt(beds),
            covid_cases: parseInt(cases)
        }

        axios.put(`${url}/${id}`, toSend).then(result => {
            console.log(result.data);
        }).catch(e => {
            console.error(e.stack);
        });
    }

    const handleClick = (e) => {
        e.stopPropagation();
        if (e.target.className === "overlays") setAddMark([e.lngLat[0], e.lngLat[1]]);
    };

    return (
        <div>
            <ViewToggle
                selected={selectedViewMode}
                toggleSelected={() => {
                    setViewMode((selectedViewMode === "capacity" ? "cases" : "capacity"));
                }}
            >
            </ViewToggle>

            <InteractiveMap
                {...viewport}
                mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                mapStyle="mapbox://styles/zeta762/ckj5ne85s4gnb19njp73wq4fp"
                onViewportChange={viewport => { setViewport(viewport) }}
                onClick={handleClick}
                maxZoom={20}
                ref={mapRef}
            >
                <Geocoder
                    mapRef={mapRef}
                    onViewportChange={handleGeocoderViewportChange}
                    mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
                    position="top-right"
                />

                <div style={geolocateStyle}>
                    <GeolocateControl />
                </div>
                <div style={fullscreenControlStyle}>
                    <FullscreenControl />
                </div>
                <div style={navStyle}>
                    <NavigationControl />
                </div>
                <div style={scaleControlStyle}>
                    <ScaleControl />
                </div>

                {clusters.map(cluster => {
                    const [longitude, latitude] = cluster.geometry.coordinates;

                    const properties = cluster.properties || {};

                    // render cluster marker
                    if (properties.cluster) {
                        const size = (selectedViewMode === "capacity" ? `${50 + (properties.capacity / (totalCap + 1)) * 40}px` : `${50 + (properties.totalCases / (allCases + 1)) * 40}px`);
                        return (
                            <Marker
                                key={cluster.id}
                                longitude={longitude}
                                latitude={latitude}
                            >
                                <div className="cluster-marker"
                                    style={{
                                        backgroundColor: (selectedViewMode === "capacity" ? "blue" : "red"),
                                        width: size,
                                        height: size
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        const expandZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);

                                        setViewport({
                                            ...viewport,
                                            latitude,
                                            longitude,
                                            zoom: expandZoom,
                                            transitionInterpolator: new FlyToInterpolator({ speed: 1.2 }),
                                            transitionDuration: "auto"
                                        })
                                        setAddMark(null);
                                    }}>
                                    {(selectedViewMode === "capacity" ? properties.capacity : properties.totalCases)}
                                </div>
                            </Marker>
                        );
                    }

                    return (
                        <Marker
                            key={cluster.properties.hospitalID}
                            latitude={latitude}
                            longitude={longitude}
                        >

                            <button className="marker-btn" onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (!cluster.properties.cluster) setSelectedHospital(cluster);
                            }}>
                                <img src="red_cross.svg" alt="Hospital marker icon"></img>
                            </button>
                        </Marker>
                    );

                })}

                {selectedHospital ? (
                    <Popup
                        latitude={selectedHospital.geometry.coordinates[1]}
                        longitude={selectedHospital.geometry.coordinates[0]}
                        onClose={() => {
                            setSelectedHospital(null);
                        }}

                        onClick={() => console.log(selectedHospital)}
                        closeOnClick={false}
                        tipSize={5}
                        anchor="top"
                    >

                        <div>
                            <h5>{selectedHospital.properties.name}</h5>
                            <span># of beds: </span>
                            <EditableText fieldName="beds" updateHandler={handleUpdate} text={selectedHospital.properties.beds} />
                            <br />
                            <span># of cases: </span>
                            <EditableText fieldName="cases" updateHandler={handleUpdate} text={selectedHospital.properties.covid_cases} />
                        </div>
                    </Popup>
                ) : null}


                {!selectedHospital && addMark ? (
                    <Popup
                        latitude={addMark[1]}
                        longitude={addMark[0]}
                        onClose={() => {
                            setAddMark(null);
                            setNewHospital("");
                        }}
                        closeOnClick={false}
                        tipSize={30}
                        anchor="top"
                    >

                        <div>
                            <div>Add marker?</div>
                            <input name="newHospital" onChange={e => { setNewHospital(e.target.value); console.log(newHospital) }} placeholder="Hospital name"></input>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                axios.post(url, {
                                    name: newHospital,
                                    longitude: parseFloat(addMark[0]),
                                    latitude: parseFloat(addMark[1])
                                }).then(response => {
                                    // build
                                    const q = {
                                        type: "Feature",
                                        properties: {
                                            cluster: false,
                                            hospitalID: response.data.id,
                                            name: newHospital,
                                            state: null,
                                            beds: 0,
                                            covid_cases: 10,
                                        },
                                        geometry: {
                                            type: "Point",
                                            coordinates: [parseFloat(addMark[0]), parseFloat(addMark[1])]
                                        }
                                    }
                                    setPoints(points => [...points, q])
                                    setAddMark(null);
                                })
                            }}>ADD</button>
                        </div>
                    </Popup>
                ) : null}
            </InteractiveMap>
        </div>
    );
}

export default Map;
