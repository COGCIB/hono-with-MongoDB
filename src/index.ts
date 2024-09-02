import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { randomUUID, UUID } from "crypto";
import { stream, streamText, streamSSE } from "hono/streaming";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import dbConnect from "./db/connect";
import FavYoutubeVideoModel from "./db/youtube-video-model";
import { isValidElement } from "hono/jsx";
import { isValidObjectId } from "mongoose";

const app = new Hono();
app.use(poweredBy(), logger());
dbConnect()
  .then(() => {
    // GET all the videos

    app.get("/", async (c) => {
      const documents = await FavYoutubeVideoModel.find({});
      return c.json(
        documents.map((d) => d.toObject()),
        200
      );
    });

    // CREATE a document

    app.post("/", async (c) => {
      const document = await c.req.json();
      if (!document.thumbnailUrl) delete document.thumbnailUrl;
      const newDocument = new FavYoutubeVideoModel(document);
      try {
        const doc = await newDocument.save();
        return c.json(doc.toObject(), 201);
      } catch (err) {
        return c.json({ error: "Error creating a new document" });
      }
    });
    //TEST: endpoint to test
    app.get("/test", async (c) => {
      return c.json({
        message: "testing if the end point is working properly",
      });
    });
    //GET record by ID

    app.get("/:documentId", async (c) => {
      const id = c.req.param("documentId");
      if (!isValidObjectId(id)) {
        return c.json({ error: "Invalid ObjectId used" }, 400);
      }
      const document = await FavYoutubeVideoModel.findById(id);
      if (!document) return c.json({ error: "no such record exist" }, 404);
      return c.json(document.toObject(), 200);
    });

    // GET all record using stream helper class
    app.get("/d/:documentId", async (c) => {
      const id = c.req.param("documentId");
      if (!isValidObjectId(id)) {
        return c.json({ error: "Invalid ObjectId used" }, 400);
      }
      const document = await FavYoutubeVideoModel.findById(id);
      if (!document) return c.json({ error: "no such record exist" }, 404);

      return streamText(c, async (stream) => {
        stream.onAbort(() => {
          console.log("Aborted!");
        });
        for (let i = 0; i < document.description.length; i++) {
          await stream.write(document.description[i]);
          // Wait 1 second.
          await stream.sleep(100);
        }
      });
    });
    // UPDATE : using documentId

    app.patch("/:documentId", async (c) => {
      const id = c.req.param("documentId");
      if (!isValidObjectId(id)) {
        return c.json({ error: "Invalid ObjectId used" }, 400);
      }
      const document = await FavYoutubeVideoModel.findById(id);
      if (!document) return c.json({ error: "no such record exist" }, 404);

      const doc = await c.req.json();
      if (!doc.thumbnailUrl) delete doc.thumbnailUrl;
      try {
        const result = await FavYoutubeVideoModel.findByIdAndUpdate(id, doc, {
          new: true,
        });
        return c.json(result?.toObject());
      } catch (error) {
        c.json({ error: "failed to update the record" }, 500);
      }
    });

    //DELETE : using a documentId
    app.delete("/:documentId", async (c) => {
      const id = c.req.param("documentId");
      if (!isValidObjectId(id)) {
        return c.json({ error: "Invalid ObjectId used" }, 400);
      }
      try {
        const result = await FavYoutubeVideoModel.findByIdAndDelete(id);
        return c.json(result?.toObject(), 200);
      } catch (error) {
        c.json({ error: "failed to update the record" }, 500);
      }
    });
  })
  .catch((error) => {
    app.get("/*", (c) => {
      return c.text(`Failed to connect to MongoDB database :${error.message}`);
    });
  });

app.onError((error, c) => {
  return c.text(`App Error: ${error.message}`);
});
let video = [];

//get all the videos
app.get("/", (c) => {
  return c.json(video);
});

// post : method

app.post("/", async (c) => {
  const { videoName, channelName, duration } = await c.req.json();
  const newVideo = {
    id: randomUUID(),
    videoName,
    channelName,
    duration,
  };
  video.push(newVideo);
  return c.json(newVideo);
});

// lets get all the videos using stream
app.get("/videos", (c) => {
  return streamText(c, async (stream) => {
    for (const vid of video) {
      await stream.write(JSON.stringify(vid));
      await stream.sleep(1000);
    }
  });
});

// get videos by by it's id

app.get("/videos/:id", (c) => {
  const vid = video.find((el) => el.id === c.req.param("id"));
  if (!vid) {
    return c.json({ error: "no such video record is found" }, 404);
  }
  return c.json(vid);
});

// update a video record

app.put("/videos/:id", async (c) => {
  const { id } = c.req.param();
  // const upVideo = video.find((el) => el.id === id);
  // if (!upVideo) {
  //   return c.json({ error: "No such video record found" }, 404);
  // }
  // const { videoName, channelName, duration } = await c.req.json();
  // upVideo.videoName = videoName;
  // upVideo.channelName = channelName;
  // upVideo.duration = duration;

  // return c.json(upVideo);
  const index = video.findIndex((el) => el.id === id);
  if (index === -1) {
    return c.json({ error: "No such video record found" }, 404);
  }
  const { videoName, channelName, duration } = await c.req.json();

  video[index] = { ...video[index], videoName, channelName, duration };
  return c.json(video[index]);
});

// delete a video record by id
app.delete("/videos/:id", (c) => {
  const { id } = c.req.param();
  const index = video.findIndex((el) => el.id === id);
  if (index === -1) {
    return c.json({ error: "No such video record found" }, 404);
  }
  video.splice(index, 1);
  return c.json({ message: ` video record with ${id} successfuly deleted` });
});
const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
