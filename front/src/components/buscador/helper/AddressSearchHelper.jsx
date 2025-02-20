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

    const [marker, setMarker] = useState(null);

    const searchAddress = async (e) => {
        e.preventDefault();
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
                            { "match_phrase": { "name": streetName } }
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
              
                if (marker) {
                    marker.remove();
                }
               
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

    return {
        department, setDepartment,
        province, setProvince,
        district, setDistrict,
        street, setStreet,
        searchAddress
    };
};
