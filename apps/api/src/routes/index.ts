import { Router } from "express";

import { conversationController } from "./conversation.controller";

const router = Router();

router.post("/conversation", conversationController.create);

export { router };
