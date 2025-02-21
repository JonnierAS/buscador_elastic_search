/**
 * AddressSearchHelper es un hook personalizado que proporciona funcionalidades para buscar direcciones 
 * utilizando Elasticsearch y mostrar los resultados en un mapa interactivo.
 * 
 * Este hook maneja la búsqueda de direcciones por departamento, provincia, distrito y calle, además de 
 * permitir búsquedas completas a partir de una dirección completa. También gestiona la visualización 
 * de marcadores en el mapa y la interacción con la API de Elasticsearch.
 */

import { useState } from "react";
import { http } from "../../../services/api"; // Servicio HTTP para realizar solicitudes a Elasticsearch
import { useLocalState } from "../../../context/GlobalState"; // Contexto global para acceder al mapa
import { Marker, Popup } from "maplibre-gl"; // Componentes para manejar marcadores y popups en el mapa

export const AddressSearchHelper = () => {
    // Accede al mapa desde el contexto global
    const { mapRef } = useLocalState();

    // Estados para almacenar los valores de entrada del usuario
    const [department, setDepartment] = useState(""); // Departamento
    const [province, setProvince] = useState(""); // Provincia
    const [district, setDistrict] = useState(""); // Distrito
    const [street, setStreet] = useState(""); // Calle
    const [completeAddress, setCompleteAddress] = useState(""); // Dirección completa
    const [marker, setMarker] = useState(null); // Marcador actual en el mapa

    /**
     * Función para buscar una dirección específica basada en departamento, provincia, distrito y calle.
     * @param {Event} e - Evento de envío del formulario.
     */
    const searchAddress = async (e) => {
        e.preventDefault(); // Previene el comportamiento predeterminado del formulario

        // Elimina el marcador existente si existe
        if (marker) {
            marker.remove();
        }

        try {
            // Formatea los datos ingresados por el usuario
            const formattedDepartment = department.trim().toUpperCase();
            const formattedProvince = province.trim().toUpperCase();
            const formattedDistrict = district.trim().toUpperCase();
            const formattedStreet = street.trim().toUpperCase();

            // Divide la calle en partes para separar el nombre de la calle y el número
            const streetParts = formattedStreet.split(" ");
            const number = streetParts.find(part => /^\d+$/.test(part)) || ""; // Extrae el número
            const streetName = streetParts.filter(part => !/^\d+$/.test(part)).join(" "); // Extrae el nombre de la calle

            // Realiza la solicitud a Elasticsearch
            const response = await http.post("/calles_numero_de_puerta/_search", {
                query: {
                    bool: {
                        must: [
                            { term: { "cod_departament.keyword": formattedDepartment } },
                            { term: { "cod_province.keyword": formattedProvince } },
                            { term: { "cod_district.keyword": formattedDistrict } },
                            { match: { name: { query: streetName, fuzziness: "AUTO" } } }
                        ],
                        ...(number && {
                            filter: [
                                {
                                    nested: {
                                        path: "housenumbers",
                                        query: {
                                            bool: {
                                                must: [{ term: { "housenumbers.number.keyword": number } }]
                                            }
                                        }
                                    }
                                }
                            ]
                        })
                    }
                }
            }, {
                headers: {
                    Authorization: `Basic ${btoa(import.meta.env.VITE_ELASTIC_CREDENTIALS)}`, // Credenciales codificadas en Base64
                    "Content-Type": "application/json"
                }
            });

            // Busca las coordenadas correspondientes al número de puerta
            const lnglat = response.data.hits.hits[0]._source.housenumbers.find(door => door.number.toString() === number.toString());

            if (lnglat) {
                // Centra el mapa en las coordenadas encontradas
                mapRef.getMap().flyTo({
                    center: [lnglat.location.lon, lnglat.location.lat],
                    zoom: 18,
                    essential: true
                });

                // Crea un nuevo marcador y lo añade al mapa
                const newMarker = new Marker()
                    .setLngLat([lnglat.location.lon, lnglat.location.lat])
                    .setPopup(new Popup().setHTML(`<h1>${lnglat.location.lon}, ${lnglat.location.lat}</h1>`))
                    .addTo(mapRef.getMap());

                setMarker(newMarker); // Actualiza el estado del marcador
            } else {
                console.warn("No se encontró un número de puerta coincidente.");
            }
        } catch (error) {
            console.error("Error al buscar la dirección:", error);
        }
    };

    /**
     * Función para buscar una dirección completa en formato "Departamento, Provincia, Distrito, Calle Número".
     * @param {Event} e - Evento de envío del formulario.
     */
    const searchCompleteAddress = async (e) => {
        e.preventDefault(); // Previene el comportamiento predeterminado del formulario

        // Elimina el marcador existente si existe
        if (marker) {
            marker.remove();
        }

        // Divide la dirección completa en partes
        const addressParts = completeAddress.split(",").map(part => part.trim().toUpperCase());

        // Verifica que la dirección tenga el formato correcto
        if (addressParts.length < 4) {
            console.warn("Formato de dirección incorrecto. Debe ser 'Departamento, Provincia, Distrito, Calle Número'.");
            return;
        }

        const formattedDepartment = addressParts[0]; // Departamento
        const formattedProvince = addressParts[1]; // Provincia
        const formattedDistrict = addressParts[2]; // Distrito

        // Divide la parte de la calle para extraer el nombre y el número
        const streetParts = addressParts[3].split(" ");
        const number = streetParts.find(part => /^\d+$/.test(part)) || ""; // Extrae el número
        const streetName = streetParts.filter(part => !/^\d+$/.test(part)).join(" "); // Extrae el nombre de la calle

        console.log({ formattedDepartment, formattedProvince, formattedDistrict, streetName, number });

        try {
            // Realiza la solicitud a Elasticsearch
            const response = await http.post("/calles_numero_de_puerta/_search", {
                query: {
                    bool: {
                        must: [
                            { term: { "cod_departament.keyword": formattedDepartment } },
                            { term: { "cod_province.keyword": formattedProvince } },
                            { term: { "cod_district.keyword": formattedDistrict } },
                            { match: { name: { query: streetName, fuzziness: "AUTO" } } }
                        ],
                        ...(number && {
                            filter: [
                                {
                                    nested: {
                                        path: "housenumbers",
                                        query: {
                                            bool: {
                                                must: [{ term: { "housenumbers.number.keyword": number } }]
                                            }
                                        }
                                    }
                                }
                            ]
                        })
                    }
                }
            }, {
                headers: {
                    Authorization: `Basic ${btoa(import.meta.env.VITE_ELASTIC_CREDENTIALS)}`, // Credenciales codificadas en Base64
                    "Content-Type": "application/json"
                }
            });

            // Verifica si se encontraron resultados
            if (response.data.hits.hits.length === 0) {
                console.warn("No se encontraron resultados en Elasticsearch.");
                return;
            }

            // Busca las coordenadas correspondientes al número de puerta
            const housenumbers = response.data.hits.hits[0]._source.housenumbers || [];
            const lnglat = housenumbers.find(door => door.number.toString() === number.toString());

            if (lnglat) {
                // Centra el mapa en las coordenadas encontradas
                mapRef.getMap().flyTo({
                    center: [lnglat.location.lon, lnglat.location.lat],
                    zoom: 18,
                    essential: true
                });

                // Crea un nuevo marcador y lo añade al mapa
                const newMarker = new Marker()
                    .setLngLat([lnglat.location.lon, lnglat.location.lat])
                    .setPopup(new Popup().setHTML(`<h1>${lnglat.location.lon}, ${lnglat.location.lat}</h1>`))
                    .addTo(mapRef.getMap());

                setMarker(newMarker); // Actualiza el estado del marcador
            } else {
                console.warn("No se encontró un número de puerta coincidente.");
            }
        } catch (error) {
            console.error("Error al buscar la dirección completa:", error);
        }
    };

    // Retorna los estados y funciones necesarias para ser utilizados en componentes
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