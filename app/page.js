import ClientHome from "./components/ClientHome";
import { getGalleryImages } from "../lib/cloudinary";

export default async function Home() {
    const images = await getGalleryImages();
    return <ClientHome initialImages={images} />;
}
