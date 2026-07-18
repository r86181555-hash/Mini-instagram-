export const CLOUDINARY = {
cloudName: "nhy9lfkt",
uploadPreset: "rhk_upload"
};

export async function uploadImage(file){

const formData = new FormData();

formData.append("file", file);

formData.append("upload_preset", CLOUDINARY.uploadPreset);

const res = await fetch(

`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,

{
method:"POST",
body:formData
}
);

const data = await res.json();

return data.secure_url;

}
