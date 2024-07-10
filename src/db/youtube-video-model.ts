import { Schema, model } from "mongoose";

export interface IFavYoutuveVideosSchema {
  title: string;
  description: string;
  thumbnailUrl?: string;
  watched: boolean;
  youtuberName: string;
}

const FavYoutubeVideoSchema = new Schema<IFavYoutuveVideosSchema>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    default: "https://via.placehoder.com/1600x900.webp",
    required: false,
  },
  watched: {
    type: Boolean,
    default: false,
    required: true,
  },
  youtuberName: {
    type: String,

    required: true,
  },
});

const FavYoutubeVideoModel = model("fav-youtube-video", FavYoutubeVideoSchema);
export default FavYoutubeVideoModel;
