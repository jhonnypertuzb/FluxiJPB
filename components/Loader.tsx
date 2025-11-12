
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div>
        <h2 className="text-2xl font-bold mt-8 text-white">Generando Magia...</h2>
        <p className="text-slate-300 mt-2">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
