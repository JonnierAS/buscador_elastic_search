import { useState, useCallback, useRef } from "react";
import { http } from "../../../services/api";
import { useLocalState } from "../../../context/GlobalState";
import { Marker, Popup } from "maplibre-gl";

export const AddressSearchHelper = () => {
    const { mapRef } = useLocalState();
    // Estados para almacenar los valores de búsqueda y mensajes de error
    const [department, setDepartment] = useState("");
    const [province, setProvince] = useState("");
    const [district, setDistrict] = useState("");
    const [street, setStreet] = useState("");
    const [completeAddress, setCompleteAddress] = useState("");
    const [error, setError] = useState(null);

    // Referencia para almacenar el marcador y evitar múltiples renders
    const markerRef = useRef(null);

    /**
     * Formatea los parámetros de búsqueda en mayúsculas y extrae el número de la calle.
     */
    const formatSearchParams = (department, province, district, street) => {
        const formattedDepartment = department.trim().toUpperCase();
        const formattedProvince = province.trim().toUpperCase();
        const formattedDistrict = district.trim().toUpperCase();
        
        const streetParts = street.trim().toUpperCase().split(" ");
        const number = streetParts.find(part => /^\d+$/.test(part)) || "";
        const streetName = streetParts.filter(part => !/^\d+$/.test(part)).join(" ");

        return { formattedDepartment, formattedProvince, formattedDistrict, streetName, number };
    };

    /**
     * Realiza una búsqueda en Elasticsearch utilizando los parámetros formateados.
     */
    const searchAddressInElasticsearch = async (params) => {
        try {
            const query = {
                "query": {
                    "bool": {
                        "must": [
                            { "term": { "cod_departament.keyword": params.formattedDepartment } },
                            { "term": { "cod_province.keyword": params.formattedProvince } },
                            { "match": { "cod_district": { "query": params.formattedDistrict, "fuzziness": "AUTO"  }  }},
                            { "match": {  "name": {  "query": params.streetName,  "fuzziness": "AUTO"  }   } }
                        ],
                        ...(params.number ? { 
                            "filter": [
                                {
                                    "nested": {
                                        "path": "housenumbers",
                                        "query": {
                                            "bool": {
                                                "must": [
                                                    { "term": { "housenumbers.number.keyword": params.number } }
                                                ]
                                            }
                                        }
                                    }
                                }
                            ]
                        } : {})
                    }
                }
            };

            const response = await http.post("/calles_numero_de_puerta/_search", query, {
                headers: {
                    Authorization: `Basic ${btoa(import.meta.env.VITE_ELASTIC_CREDENTIALS)}`, // Credenciales codificadas en Base64
                    "Content-Type": "application/json"
                }
            });

            if (response.data.hits.hits.length === 0) {
                throw new Error("No se encontraron resultados.");
            }

            return response.data.hits.hits[0]._source.housenumbers.find((h) => h.number.toString() === params.number.toString());
        } catch (err) {
            setError(err.message || "Error al buscar dirección.");
            return null;
        }
    };

    /**
     * Actualiza el mapa y coloca un marcador en la ubicación encontrada.
     */
    const updateMapWithLocation = (lnglat) => {
        if (!lnglat) return;

        mapRef.getMap().flyTo({
            center: [lnglat.location.lon, lnglat.location.lat],
            zoom: 18,
            essential: true
        });

        // Eliminar el marcador anterior si existe
        if (markerRef.current) {
            markerRef.current.remove();
        }

        // Crear y agregar un nuevo marcador
        const newMarker = new Marker()
            .setLngLat([lnglat.location.lon, lnglat.location.lat])
            .setPopup(new Popup().setHTML(`<h1>${lnglat.location.lon}, ${lnglat.location.lat}</h1>`))
            .addTo(mapRef.getMap());

        markerRef.current = newMarker; // Guardar referencia al nuevo marcador
    };

    /**
     * Busca una dirección a partir de los valores individuales de ubicación.
     */
    const searchAddress = useCallback(async (e) => {
        e.preventDefault();
        setError(null);
        
        const params = formatSearchParams(department, province, district, street);
        const lnglat = await searchAddressInElasticsearch(params);
        updateMapWithLocation(lnglat);
    }, [department, province, district, street]);

     /**
     * Busca una dirección basada en una entrada completa (ej. "Dpto, Prov, Dist, Calle").
     */
    const searchCompleteAddress = useCallback(async (e) => {
        e.preventDefault();
        setError(null);

        const addressParts = completeAddress.split(",").map(part => part.trim().toUpperCase());
        if (addressParts.length < 4) {
            setError("Formato de dirección incorrecto.");
            return;
        }

        const params = formatSearchParams(addressParts[0], addressParts[1], addressParts[2], addressParts[3]);
        const lnglat = await searchAddressInElasticsearch(params);
        updateMapWithLocation(lnglat);
    }, [completeAddress]);

    return {
        department, setDepartment,
        province, setProvince,
        district, setDistrict,
        street, setStreet,
        completeAddress, setCompleteAddress,
        searchAddress,
        searchCompleteAddress,
        error
    };
};
