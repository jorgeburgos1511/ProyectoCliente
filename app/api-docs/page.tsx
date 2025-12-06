"use client";

import dynamic from "next/dynamic";
import React from "react";
import "swagger-ui-react/swagger-ui.css";


const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const url = "/api/docs/openapi";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold">TaskFlow API Docs</h1>
        <SwaggerUI url={url} docExpansion="list" defaultModelsExpandDepth={1} />
      </div>
    </div>
  );
}
