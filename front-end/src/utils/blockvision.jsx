import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";

export const blockvision = async (userAddress) => {
  const suiClient = new SuiClient({ url: getFullnodeUrl("devnet") });
  const objects = await suiClient.getOwnedObjects({
    owner: userAddress,
  });
  // console.log("objet", objects);
  const widgets = [];

  // iterate through all objects owned by address
  for (let i = 0; i < objects.data.length; i++) {
    const currentObjectId = objects.data[i].data.objectId;

    // get object information
    const objectInfo = await suiClient.getObject({
      id: currentObjectId,
      options: { showContent: true },
    });

    // console.log("objectInfo", objectInfo);
    // packageId is
    //   "0x234604afac20711ef396f60601eeb8c0a97b7d9f0c4d33c5d02dafe6728d41be";
    if (
      objectInfo?.data?.content?.type ==
      `0x234604afac20711ef396f60601eeb8c0a97b7d9f0c4d33c5d02dafe6728d41be::voyagerprofile::NFT`
    ) {
      // const widgetObjectId = objectInfo.data.content.fields.id.id;
      const widgetObjectId = objectInfo.data;
      // console.log("widget spotted:", widgetObjectId);
      widgets.push(widgetObjectId);
    }
  }
  return widgets;
};
