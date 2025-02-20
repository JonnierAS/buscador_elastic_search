import React, { useState } from "react";
import { AddressSearchHelper } from "./helper/AddressSearchHelper";

const AddressSearchModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const helper = AddressSearchHelper()

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Botón para mostrar/ocultar el modal */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleVisibility}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        >
          {isVisible ? "Ocultar Buscador" : "Mostrar Buscador"}
        </button>
      </div>

      {/* Modal */}
      {isVisible && (
        <div className="fixed top-20 right-4 z-40">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96">
            <form onSubmit={helper.searchAddress}>
              {/* Campo para Departamento */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Departamento</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el departamento"
                  value={helper.department}
                  onChange={(e)=>helper.setDepartment(e.target.value)}
                />
              </div>

              {/* Campo para Provincia */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Provincia</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese la provincia"
                  value={helper.province}
                  onChange={(e)=>helper.setProvince(e.target.value)}
                />
              </div>

              {/* Campo para Distrito */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Distrito</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el distrito"
                  value={helper.district}
                  onChange={(e)=>helper.setDistrict(e.target.value)}
                />
              </div>

              {/* Campo para Calle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Calle</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese la calle"
                  value={helper.street}
                  onChange={(e)=>helper.setStreet(e.target.value)}
                />
              </div>

              {/* Botón de búsqueda */}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddressSearchModal;