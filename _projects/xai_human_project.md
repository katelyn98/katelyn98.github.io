---
layout: page
title: Exploring XRAI Saliency Map
description: Evaluating XRAI Saliency Map under different scenarios using different models.
img: /assets/img/xrai.png
importance: 1
category: Explainable AI, Computer Vision
---

## Tutorial Details/Notes

Followed a Google PAIR tutorial on their saliency maps (including XRAI). The tutorial can be found [here](https://github.com/PAIR-code/saliency/blob/master/Examples_pytorch.ipynb). The tutorial is based on pytorch (what I am familiar with using). The tutorial is using a pretrained inception_v3 model from pytorch. 

## Brief introduction to XRAI

View [this paper](https://arxiv.org/pdf/1906.02825.pdf) and [this code repository](#) to learn more about XRAI from Google PAIR team. Something unique about this method is that it can focus on multiple regions in an image. 

## Experiments and Outcomes

More experiments that I did can be found in this [**Google Colab**](https://drive.google.com/file/d/1JcLeXmbA68CO0hANTVFVv-jGBa61Kvk-/view?usp=sharing) which is kinda messy at the moment. I think that code readability, reproducability, and documentation is extremely improtant for reserach to excel. 

*Below are the outcomes of the tutorial along with further directions I investigated. These are all preliminary results. I am showcasing the experiments to highlight my ability to use these tools and ask interesting questions.* 

### Inception V3 vs VGG16

***Inception V3***

<img src="/assets/img/inceptionv3top30.png" alt="drawing" width="100%"/>

The tutorial uses a doberman image as their example. You can see based on the XRAI heatmap that the most important feature was the snout of the doberman to classify it specifically as a doberman. The top 30% is the most salient 30% of the image. It includes some portions of the sidewalk here. Below we can also so the most salient 10% of the image.

<img src="/assets/img/inceptionv3.png" alt="drawing" width="100%"/>

***VGG-16***

<img src="/assets/img/vgg16.png" alt="drawing" width="100%"/>

The VGG did predict that this was a doberman, but you can see that it is focusing on different features to get to its conclusion. It really highlights the whole shape of the dog in the XRAI heatmap as well whereas the inceptionv3 did not focus that strongly on shape of the dog, but primarily the snout. 

---

### Human vs Inception V3 & VGG16

After seeing how these two models produced significantly different XRAI heatmaps, I wondered how humans would produce this heatmap for the same image. I conducted a very low-cost study to find some preliminary results. I drafted up some very [simple directions](https://drive.google.com/file/d/1CuVTnwA4-vSRJcl0fie9-BxVMut4GXo0/view?usp=sharing) and sent it to four of my friends. Their results can be seen below. 

<img src="/assets/img/humanresults.png" alt="drawing" width="100%"/>

**Future Work**. Running this study on a large scale and then averaging the color for every pixel from the study results would generate one final image which may or may not look similar to the model's XRAI heatmap. If it does look similar, this can suggest that humans do use similar features that these models use when reasoning the classification of an image. The collected human-generated saliency maps can be used to fine tune a model to generate saliency maps that are human-like. It could be useful to just see the output of this expeirment regardless to identify future directions. 


---

### Out-of-distribution Images

**Corruptions**

Different convolutional models perform slightly different when presented corrupted images. This can be determined by just reading the prediction from the model. For example, when you apply a glass blur of severity 2 on the image, an inception_v3 will predict it is an Airedale terrier. When you use a VGG it will predict that it is instead a Tibetan mastiff. All you can see is the prediction of each of these two models, but viewing the saliency map for both of these predictions will show how it deviates from the important features in the original image. 

<img src="/assets/img/inceptionv3glassblur2.png" alt="drawing" width="100%"/>

*Corruption glass blur of severity 2 applied. Inception V3 predicted an Airedale terrier. Note: this image was obtained from [ImageNet-C](https://github.com/hendrycks/robustness).*  

The model is looking at different features when the image is slightly corrupt with glass blur (severity level 2). It focuses more on the shape of the dogs body in the XRAI heatmap here, too. 

<img src="/assets/img/vgg16glassblur2.png" alt="drawing" width="100%"/>

*Corruption glass blur of severity 2. VGG-16 predicted a Rottweiler. Note: this image was obtained from [ImageNet-C](https://github.com/hendrycks/robustness).* 

Here, the model is looking again strongly at the shape of the image, but is focusing on different features to get to its decision. 


**Shape-Texture Bias**

To learn more about shape bias and the texture cue-conflict dataset, please view this [GitHub repository](https://github.com/rgeirhos/texture-vs-shape). Looking at conflicting shapes/texture stylization where the shape is a dpg amd the texture is an elephant:

<img src="/assets/img/inceptionv3shapebias.png" alt="drawing" width="100%"/>

Shape of dog stylized with texture of elephant. InceptionV3 prediction is 'African elephant, Loxodonta africana'. We can see from XRAI that this model focuses heavily on the texture markings of the elephant instead of the general shape of the dog. 

Now looking at where the shape is a cat and the texture is an elephant:

<img src="/assets/img/inceptionv3shapebiascat.png" alt="drawing" width="100%"/>

The InceptionV3 prediction was also 'African elephant, Loxodonta africana'. We can see it is focusing on the creases in the elephant skin. 

---

### Future Work

These results are just preliminary experiments that I did. More work should be done on other models, other corruptions from ImageNet-C, and other texture cue-conflicts. Should continue this more on other severity levels, other corruptions, and other models. 