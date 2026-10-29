/**
 * Fondo global de la app.
 *
 * Para usar el componente original de React Bits Pro:
 *   1. Configura REACTBITS_LICENSE_KEY en .env.local (ver README).
 *   2. npm run add:drape
 *   3. Cambia el import de abajo por el archivo que instaló el CLI, por ejemplo:
 *      import SpectralDrape from "@/components/spectral-drape";
 * La interfaz de props es la misma, así que no hay que tocar nada más.
 */
import SpectralDrape from "@/components/backgrounds/spectral-drape-fallback";

export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <SpectralDrape
        backgroundColor="#0d0a1a"
        className="h-full w-full"
        clickRipples
        colors={["#6b1c2a", "#f0d060"]}
        colorShift={0.35}
        depth={1.1}
        density={1.3}
        zoom={1.55}
        intensity={1.4}
        interactive
        parallax={0.8}
        roll={110}
        softness={0.6}
        speed={0.6}
        strands={7}
        tilt={-38}
        turn={-42}
      />
      {/* velo para legibilidad: oscurece donde vive el contenido */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_85%_0%,rgba(46,26,71,0.55),transparent_60%),linear-gradient(180deg,rgba(13,10,26,0.05),rgba(13,10,26,0.35)_60%,rgba(13,10,26,0.6))]" />
    </div>
  );
}
