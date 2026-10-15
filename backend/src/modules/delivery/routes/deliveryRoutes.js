import express from 'express';
import * as deliveryController from '../controllers/deliveryController.js';

// import Express, create and dedicate a router object. in a short sense, handles all the traffic meant for the delivery module.
const router = express.Router();

// map the specific HTTP methoods on the basis of URL in order to match controller functions
router.post('/', deliveryController.queueDelivery);
router.get('/', deliveryController.getDeliveryHistory);

export default router;