
const listClothes = async () => {
    const params = { Bucket: process.env.S3_BUCKET_NAME, Prefix: "clothes/" };
    const data = await s3.listObjectsV2(params).promise();
    let clothes = {};
    if (data.Contents) {
      for (const obj of data.Contents) {
        const parts = obj.Key.split("/");
        if (parts.length >= 3) {
          const category = parts[1]; 
          const itemName = parts[2];
  
          if (!clothes[category]) {
            clothes[category] = [];
          }
  
          clothes[category].push({
            name: itemName,
            url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
          });
        }
      }
    }
    // console.log("Available Clothes:", clothes);
    return clothes;
  };
//   listClothes();
  module.exports = { listClothes };