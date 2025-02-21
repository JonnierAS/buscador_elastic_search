import { useState } from "react";
import { http } from "../../../services/api";
import { useLocalState } from "../../../context/GlobalState";
import { Marker, Popup } from "maplibre-gl";

export const AddressSearchHelper = () => {
    const {mapRef} = useLocalState()
    const [department, setDepartment] = useState("");
    const [province, setProvince] = useState("");
    const [district, setDistrict] = useState("");
    const [street, setStreet] = useState("");
    const [completeAddress, setCompleteAddress] = useState("")

    const [marker, setMarker] = useState(null);

    const searchAddress = async (e) => {
        e.preventDefault();
        if (marker) {
            marker.remove();
        }
        try {
            // Convertir datos a mayúsculas
            const formattedDepartment = department.trim().toUpperCase();
            const formattedProvince = province.trim().toUpperCase();
            const formattedDistrict = district.trim().toUpperCase();
            const formattedStreet = street.trim().toUpperCase();

            // Extraer el número de la calle (última palabra numérica en el string)
            const streetParts = formattedStreet.split(" ");
            const number = streetParts.find(part => /^\d+$/.test(part)) || "";

            // Extraer solo el nombre de la calle sin el número
            const streetName = streetParts.filter(part => !/^\d+$/.test(part)).join(" ");

            const response = await http.post("/calles_numero_de_puerta/_search", {
                "query": {
                    "bool": {
                        "must": [
                            { "term": { "cod_departament.keyword": formattedDepartment } },
                            { "term": { "cod_province.keyword": formattedProvince } },
                            { "term": { "cod_district.keyword": formattedDistrict } },
                            { 
                                "match": { 
                                    "name": { 
                                        "query": streetName,
                                        "fuzziness": "AUTO" 
                                    } 
                                }
                            }
                        ],
                        ...(number ? { 
                            "filter": [
                                {
                                    "nested": {
                                        "path": "housenumbers",
                                        "query": {
                                            "bool": {
                                                "must": [
                                                    { "term": { "housenumbers.number.keyword": number } }
                                                ]
                                            }
                                        }
                                    }
                                }
                            ]
                        } : {})
                    }
                }
            }, {
                headers: {
                    "Authorization": `Basic ${btoa("admin:J1234567")}`, // Codifica usuario y contraseña en Base64
                    "Content-Type": "application/json"
                }
            });            

            
            
            const lnglat = response.data.hits.hits[0]._source.housenumbers.find(door => {
                return door.number.toString() === number.toString();

            })
            
            if (lnglat) {
                mapRef.getMap().flyTo({
                    center: [lnglat.location.lon, lnglat.location.lat], // Coordenadas del punto
                    zoom: 18, // Nivel de zoom deseado
                    essential: true // Para garantizar que la animación ocurra
                });
              
               
                const newMarker = new Marker()
                    .setLngLat([lnglat.location.lon, lnglat.location.lat])
                    .setPopup(new Popup().setHTML(`<h1>${lnglat.location.lon, lnglat.location.lat}</h1>`))
                    .addTo(mapRef.getMap());
                
                setMarker(newMarker);
            } else {
                console.warn("No se encontró un número de puerta coincidente.");
            }

        } catch (error) {
            console.log(error);
        }
    };

    const searchCompleteAddress = async (e) => {
        e.preventDefault();
        if (marker) {
            marker.remove();
        }
    
        // Dividir la dirección en partes
        const addressParts = completeAddress.split(",").map(part => part.trim().toUpperCase()); // Convertir todo a mayúsculas
        
        // Extraer los valores en orden: departamento, provincia, distrito, calle con número
        if (addressParts.length < 4) {
            console.warn("Formato de dirección incorrecto.");
            return;
        }
    
        const formattedDepartment = addressParts[0];
        const formattedProvince = addressParts[1];
        const formattedDistrict = addressParts[2];
    
        // Extraer calle y número
        const streetParts = addressParts[3].split(" ");
        const number = streetParts.find(part => /^\d+$/.test(part)) || ""; // Buscar número en cualquier parte
        const streetName = streetParts.filter(part => !/^\d+$/.test(part)).join(" "); // El resto es la calle
    
        console.log({ formattedDepartment, formattedProvince, formattedDistrict, streetName, number });
    
        try {
            const response = await http.post("/calles_numero_de_puerta/_search", {
                "query": {
                    "bool": {
                        "must": [
                            { "term": { "cod_departament.keyword": formattedDepartment } },
                            { "term": { "cod_province.keyword": formattedProvince } },
                            { "term": { "cod_district.keyword": formattedDistrict } },
                            { 
                                "match": { 
                                    "name": { 
                                        "query": streetName,
                                        "fuzziness": "AUTO" 
                                    } 
                                }
                            }
                        ],
                        ...(number ? { 
                            "filter": [
                                {
                                    "nested": {
                                        "path": "housenumbers",
                                        "query": {
                                            "bool": {
                                                "must": [
                                                    { "term": { "housenumbers.number.keyword": number } }
                                                ]
                                            }
                                        }
                                    }
                                }
                            ]
                        } : {})
                    }
                }
            }, {
                headers: {
                    "Authorization": `Basic ${btoa("admin:J1234567")}`, // Codifica usuario y contraseña en Base64
                    "Content-Type": "application/json"
                }
            });
    
            if (response.data.hits.hits.length === 0) {
                console.warn("No se encontraron resultados en Elasticsearch.");
                return;
            }
    
            const housenumbers = response.data.hits.hits[0]._source.housenumbers || [];
    
            const lnglat = housenumbers.find(door => door.number.toString() === number.toString());
    
            if (lnglat) {
                mapRef.getMap().flyTo({
                    center: [lnglat.location.lon, lnglat.location.lat],
                    zoom: 18,
                    essential: true
                });

                const newMarker = new Marker()
                    .setLngLat([lnglat.location.lon, lnglat.location.lat])
                    .setPopup(new Popup().setHTML(`<h1>${lnglat.location.lon}, ${lnglat.location.lat}</h1>`))
                    .addTo(mapRef.getMap());
    
                setMarker(newMarker);
            } else {
                console.warn("No se encontró un número de puerta coincidente.");
            }
        } catch (error) {
            console.log(error);
        }
    };
    
    

    return {
        department, setDepartment,
        province, setProvince,
        district, setDistrict,
        street, setStreet,
        searchAddress,
        searchCompleteAddress,
        completeAddress, setCompleteAddress
    };
};
