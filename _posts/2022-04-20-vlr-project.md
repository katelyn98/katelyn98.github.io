---
layout: distill
title: Towards Generating Human-Centered Saliency Maps without Sacrificing Accuracy
date: 2022-05-09
img: /assets/img/placeholderpicture.png
importance: 2
tags: research class
categories: Explainability AI

authors:
  - name: Vivek Aswal
    url: "#"
    affiliations:
      name: ECE, CMU
  - name: Gore Kao
    url: "#"
    affiliations:
      name: ECE, CMU
  - name: Ashley Kim
    url: "#"
    affiliations:
      name: ECE, CMU
  - name: Katelyn Morrison
    url: "https://cs.cmu.edu/~kcmorris"
    affiliations:
      name: HCII, CMU

bibliography: 2022-05-09-vlr.bib

# Optionally, you can add a table of contents to your post.
# NOTES:
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - we may want to automate TOC generation in the future using
#     jekyll-toc plugin (https://github.com/toshimaru/jekyll-toc).
toc:
  - name: Introduction
    subsections:
      - name: Research Question & Contributions
  - name: Related Work
    subsections:
      - name: DNN Saliency Maps Compared to Human Attention
      - name: Towards DNNs with Human-Centered Saliency Maps
  - name: Methods
    subsections:
      - name: Empirical Study
      - name: Data Augmentations
      - name: Experiment Design
  - name: Results
    subsections:
      - name: Empirical Study
      - name: Main Experiment 
  - name: Limtations
  - name: Future Work & Conclusion
  - name: Code

# Below is an example of injecting additional post-specific styles.
# If you use this post as a template, delete this _styles block.
_styles: >
  .fake-img {
    background: #bbb;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  .fake-img p {
    font-family: monospace;
    color: white;
    text-align: left;
    margin: 12px 0;
    text-align: center;
    font-size: 16px;
  }

---

## Introduction

Artificial intelligence (AI) is increasingly being built for and deployed in high-stakes domains such as detecting cancer from medical imagery <d-cite key="10.1145/3411763.3443435"></d-cite>, disaster relief efforts <d-cite key="DBLP:journals/corr/abs-1911-09296"></d-cite>, and self-driving cars. However, these models are "black-boxes" and not interpretable to people that collaborate or interact with them <d-cite key="10.1145/3377325.3377519"></d-cite>. Therefore, the interpretability and accuracy of these models are equally important to calibrate decision-makers reliance on AI and improve human-AI collaboration. 

With explainability and interpretability of AI becoming increasingly important, ML researchers designed a wide range of techniques from visualizing what the model has learned from an entire dataset, known as feature visualizations <d-cite key="olah2017feature"></d-cite>, to visualizing the pixels or region of an image that activated a particular class prediction, known as class activation maps <d-cite key="zhou2015cnnlocalization"></d-cite>. While these techniques are all derived quantitatively from the model, they are not always semantically meaningful to humans or even highlighting the correct region in the image despite a correct prediction, known as spurious correlations <d-cite key="DBLP:journals/corr/abs-2106-02112"></d-cite>. As a result, human-computer interaction (HCI) researchers have been investigating how to make explainability techniques more interpretable by humans known as human-centered explainable AI (HCXAI) <d-cite key="DBLP:journals/corr/abs-2110-10790"></d-cite>. However, few works have explored HCXAI techniques for object detection models. We present our main research questions and primary contributions for this work below.


### Research Questions & Contributions

Our primary research questions are:
* [**RQ1**] How do current state-of-the-art object detection models compare to human attention? 
  - [**H1**] We hypothesize that current state-of-the-art object detection models do not nearly compare to human attention.
* [**RQ2**] Can data augmentation techniques make saliency maps more similar to human attention without significantly sacrificing model accuracy?
  - [**H2**] We hypothesize that some form of data augmentation that penalizes spurious patterns will result in more human-centered saliency maps.

We address these two research questions through two studies. First conduct a small, empirical study to understand how current state-of-the-art object detection models compare to human attention. In the second study, we evaluate the impact of novel human-centered, data augmentations on DNNs saliency maps. Our novel contributions include:
* We present two novel data augmentation techniques called *Selective Erasing* and *Selective Inpainting* along with the prevelant *non-trivial transforms* that can be used for augmenting images for image classification and object detection models
* We evaluate the impact that different data augmentation techniques have on saliency maps generated by Faster R-CNN.

## Related Works

Several explainable artificial intelligence (AI) techniques have been proposed as new ways to provide insights into the AI's prediction. Such techniques for computer vision tasks traditionally are presented as a heat map, highlighting the regions that most contributed to the model's prediction. However, several empirical studies in human-computer interaction literature have evaluated the interpretability of different techniques and their impact on decision-making. We present different saliency map techniques and perform empirical studies on different saliency map techniques.

### DNN Saliency Maps Compared to Human Attention

With novel interpretability techniques increasingly being developed, some researchers are taking a cognitive science approach to interpretability to understand how human attention compares to deep learning models. One study investigates if DNNs look at the same regions humans do in a visual question answering task <d-ccite key="DBLP:journals/corr/DasAZPB16"></d-ccite> while another study compares human attention to DNNs for segmentation, action recognition, and classification tasks <d-cite key="9133499,DBLP:journals/corr/abs-1906-08764"></d-cite>.

### Towards DNNs with Human-Centered Saliency Maps

Recently, papers have proposed various routes to make saliency maps more human-centered and semantically meaningful to humans. For example, Boyd et al., propose a novel loss function that uses human annotations <d-cite key="cyborg"></d-cite>. This loss function is designed to penalize the model during training for generating saliency maps that are significantly different from the human saliency maps. The same authors just recently show that human annotations can improve the generalization of a DNN <d-cite key="DBLP:journals/corr/abs-2105-03492"></d-cite>. For both of these studies, the authors had to collect ground truth annotations from human subjects in order to make this loss function which does not generalize well for other models or domains.

Instead of continuously having to collect human annotations, the MIT/Tuebingen Saliency Benchmark has designed a challenge for saliency prediction models. This benchmark has yielded several techniques that can avoid the need for human subjects to obtain approximate ground truth human attention maps <d-cite key="kummererSaliencyBenchmarkingMade2018,salMetrics_Bylinskii,Judd_2012"></d-cite>. For example, the DeepGazeIIE saliency prediction model is currently the best performing saliency prediction technique compared to gold standard metrics <d-cite key="Linardos_2021_ICCV"></d-cite>. 

## Methods

We conducted two studies to address our research questions. Below we describe each study and how the second study uses results from the first study.

### Empirical Study [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1IpOw3sfKtz_foSvRDy0nk7JyfdfDgZ23?usp=sharing)

We conducted an empirical study to gain an understanding of which state-of-the-art object detection models currently generate saliency maps similar to human attention. We evaluated and compared saliency maps generated by seven different object detection models available on PyTorch to human attention maps and predicted human eye-fixations. To obtain the human attention maps, we used the human attention maps for PASCAL2012 from the [ML-Interpretability-Evaluation-Benchmark](https://github.com/SinaMohseni/ML-Interpretability-Evaluation-Benchmark) <d-cite key="mohseni2020benchmark"></d-cite>. To obtain predicted human eye-fixations, we used the DeepGazeIIE saliency prediction model <d-cite key="Linardos_2021_ICCV"></d-cite>. The specific state-of-the-art object detection models we evaluated and compared to the human attention maps and predicted eye-fixations include YOLOV5 <d-cite key="glenn_jocher_2022_6222936"></d-cite>, Faster R-CNN with a ResNet-50 backbone <d-cite key="DBLP:journals/corr/RenHG015"></d-cite>, SSD with a VGG backbone <d-cite key="DBLP:journals/corr/LiuAESR15"></d-cite>, SSD with a MobileNet backbone <d-cite key="DBLP:journals/corr/abs-1801-04381"></d-cite>, Mask R-CNN <d-cite key="DBLP:journals/corr/HeGDG17"></d-cite>, RetinaNet <d-cite key="DBLP:journals/corr/abs-1708-02002"></d-cite>, and DETR <d-cite key="DBLP:journals/corr/abs-2005-12872"></d-cite>. 

**Experiment Details**

We generated a saliency map for every single image that had an associated human attention map (ground truth saliency) from the ML-Interpretability-Evaluation-Benchmark <d-cite key="mohseni2020benchmark"></d-cite> and for every image in the MIT1003 dataset <d-cite key="mit-saliency-benchmark"></d-cite>. 
<figure>
  <img src="/assets/img/emprical_study_pipeline.png" alt="visualization of evaluation pipeline described in text." width="100%"/>
  <figcaption> Figure 1: Visualization of evaluation pipeline for the empirical study. We generated the saliency map for an image of a dog using the SSD-VGG16 model as an example.</figcaption>
</figure>

Each image was resized to $$
512$$ x $$512
$$ 
before being evaluated on by the model. The saliency map for the object detection model is generated using the EigenCAM method (<d-cite key="DBLP:journals/corr/abs-2008-00299"></d-cite>) from the PyTorch library for CAM methods <d-cite key="jacobgilpytorchcam"></d-cite>. Once the saliency map from the object detection model is generated, the Mean Absolute Error (MAE) is calculated between the generated saliency map and the human attention map. The MAE is also calculated between the generated saliency map and the predicted human eye-fixations (produced from the DeepGazeIIE model). 

<figure>
  <img src="/assets/img/mae_visualization.png" alt="visualization of how we calculate mean absolute error." width="100%"/>
  <figcaption> Figure 2: Visualization of how Mean Absolute Error (MAE) is calculated.</figcaption>
</figure>

While the MAE to some extent can reveal how similar the saliency maps are, we also calculate Intersection over Union (IoU) between the top $$90\%$$ salient pixels of the generated saliency map and the top $$90\%$$ salient pixels from the human attention map/predicted human eye-fixation. Calculating the IoU will help reveal if the most salient region identified by the model and the humans align <d-cite key="DBLP:journals/corr/abs-2107-09234"></d-cite>.

<figure>
  <img src="/assets/img/iou_visualization.png" alt="visualization of how we calculate intersection over union." width="100%"/>
  <figcaption> Figure 3: Visualization of how Intersection over Union (IoU) is calculated.</figcaption>
</figure>


### Data Augmentations

Data augmentation for object detection is slightly more complex than data augmentation for image classification tasks because of the associated bounding boxes for each object <d-cite key="DBLP:journals/corr/abs-1906-11172"></d-cite>. 

We designed three different data augmentation techniques: ***selective erasing***, ***selective inpainting***, and ***non-trivial transformations***. Below, we define and provide examples of each of these data augmentations. 

**Selective Erasing** [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1xLAlGZHgBSIOXfWSuImUpdHBHngYmpmy?usp=sharing)



The goal of selective erasing is to get rid of potential spurious patterns, patterns that the model has learned to associate with a label even though it does not represent that label. In order to augment images using selective erasing, we send the image through Faster R-CNN and use EigenCAM to generate the saliency map from layer 4 in the backbone. We then send the image through the DeepGazeIIE model to generated the predicted eye-fixations map. We calculate the intersection over union (IoU) between the two saliency maps. If the IoU is below 0.1, meaning the two saliency maps are significantly different from one another, then we erase the top 2.5% salient pixels identified from the Faster R-CNN saliency map from the original image. We identified 6476 images that met this criteria. An example of this process and the outcomes from each step are shown in Figure 4. We chose the top 2.5% because these pixels would most likely make up the core region of a potentially spurious region. 

<figure>
<img src="/assets/img/selective_augment.png" alt="dataset augmentations" width="100%"/>
<figcaption>Figure 4: Example of how the selective erasing and selective inpainting augmentation techniques work. If the IoU between the Faster R-CNN saliency map and DeepGaze saliency map is less than 0.1 than erase the top 2.5% salient pixels from the original image. Using an untrained neural network, inpaint the pixels that were erased. In this image, pixels along the border were most salient so they were erased and then inpainted. </figcaption>
</figure>


**Selective Inpainting**
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1oK3MZeY8cpVhd5jH-7C-yMj4N0igMmvt?usp=sharing)


The selective inpainting augmentation process follows the same steps as selective erasing and then inpaints the erased image. To inpaint the top 2.5% salient pixels as denoted by Faster R-CNN, we send the selective erased image and mask into an untrained neural network and optimize on learning the pixels that minimize the chosen loss function. This idea is presented in the Deep Image Prior Paper <d-cite key="DBLP:journals/corr/abs-1711-10925"></d-cite>. We used $4001$ iterations with an untrained ResNet to inpaint the erased regions in each image. We augmented 6476 images and replaced those images in the original pascal dataset to make up the final augmented dataset.


**Non-trivial Transformations** [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://drive.google.com/file/d/1z158yrypCbLhpOGYCzsYJGXJIlhrDTW7/view?usp=sharing)


Data augmentation can improve performance and outcomes of models as it can add new and different examples to the training dataset. If the dataset in a model can be more rich and sufficient with the augmentation techniques, the model can perform better. To improve the model generalization, we apply the following augmentation techniques seen in Figure 5. In our experiment, we do experiments of bounding box geometric augmentation, color augmentation, and geometric augmentation. Augmentations considered in this experiment are from the PIL.ImageOps as well as torchvision.transforms libraries. The source codes are from the following repos: [imgaug](https://github.com/aleju/imgaug) and [AutoAugment for Detection Implementation with Pytorch](https://github.com/Jasonlee1995/AutoAugment_Detection). Each image in the dataset was augmented only once with a random augmentation selected from Figure 5. This was to ensure we had the same amount of data to fine-tune on as the other augmentation techniques. 

<figure>
  <img src="/assets/img/non-trivial_firstpart.png" alt="dataset augmentations non-trivial" width="100%"/>
  <img src="/assets/img/non-trivial_secondpart.png" alt="dataset augmentations non-trivial" width="100%"/>
  <img src="/assets/img/non-trivial_thirdpart.png" alt="dataset augmentations non-trivial" width="100%"/>
  <figcaption>Figure 5: Sample of different augmentations used in the experiment. </figcaption>  
</figure>

### Experiment Design

We gather a baseline to compare our three different data augmentations against. In Figure 6, we show the pipeline we used for the baseline. We fine-tuned Faster R-CNN on our PASCAL2012VOC training set and save the model to later evaluate it on our PASCALVOC2012 test set. During evaluation we calculate the mean average precision (mAP) at IoU of 0.5. We also calculate the MAE and IoU between the saliency maps generated by the saved model and the predicted eye-fixations. We again calculate those metrics for the saliency maps generated by the model and the human attention masks.

<figure>
  <img src="/assets/img/baseline_pipeline.png" alt="visualization of main experiment pipeline described in text." width="100%"/>
  <figcaption> Figure 6: Visualization of the pipeline for the creating and evaluating the augmented models. </figcaption>
</figure> 

For evaluating the impact of data augmentation, we created three different augmented PASCALVOC2012 training sets, one for each augmentation. Then we separately fine-tuned the pre-trained Faster R-CNN on each augmented dataset (shown in Figure 7). We do the same metric calculations as we did for the baseline model (mAP, IoU, and MAE). 

<figure>
  <img src="/assets/img/experiment_pipeline.png" alt="visualization of main experiment pipeline described in text." width="100%"/>
  <figcaption> Figure 7: Visualization of the pipeline for the creating and evaluating the augmented models. </figcaption>
</figure> 

For all fine-tuning, we used the following training parameters: 5 epochs, learning rate of 0.005, SGD optimizer with momentum set to 0.9 and weight decay set to 5e-4, and the StepLR learning rate scheduler with a step size of 2 and a gamma of 0.1.

## Results

We present results from our empirical study and our main experiment which evaluates the impact of different data augmentation techniques. The empirical study was done to get a glimpse at how current saliency maps from state-of-the-art models compare to predicted and ground truth human attention. The main experiment extends the empirical study by evaluating the impact of different data augmentation techniques on the saliency maps. 

### Empirical Study

Results for comparing the saliency maps generated by object detection models to the DeepGazeIIE's predicted eye-fixations on the MIT1003 dataset <d-cite key="5459462"></d-cite> are shown in Table 1. We calculated the Mean Absolute Error (MAE) and Intersection over Union (IoU) for each model. The MAE is preferred to be close to 0.0; the IoU is preferred to be close to 1.0. 

We observed that the SSD with a VGG backbone generated saliency maps most similar to predicted eye-fixations in terms of the IoU metric with a value of $0.2379$. DETR, a transformer-based architecture,  generated saliency maps most similar to the predicted eye-fixations in terms of the MAE metric with a value of $0.1275$. 


**Table 1: Object Detection Models compared to DeepGazeIIE Predicted Eye-Fixations for MIT1003**

| Model       | MAE         | IoU           |
| :--:       |    :--:   |     :--:     |
| YOLOV5      | $0.1799$      | $0.1895$   |
| SSD-VGG16   | $0.1643$       | **0.2379**     |
| SSD-MobileNet   | $0.1553$        | $0.1670$     |
| Faster R-CNN   | $0.1441$     | $0.1896$      |
| RetinaNet   | $0.2966$   | $0.1857$    |
| Mask R-CNN   | $0.1550$       | $0.1678$    |
| DETR   | **0.1275**     | $0.2136$     |

**Example Saliency Map Results**

<figure>
  <img src="/assets/img/mit-saliency.png" alt="visualization of sample saliency maps." width="100%"/>
  <figcaption> Figure 8: Sample saliency maps from different models compared to the predicted eye-fixations (DeepGazeIIE) for MIT1003. </figcaption>
</figure> 


We also conducted the same study between the saliency maps from the models and the predicted eye-fixations as well as ground truth for a subset of PASCALVOC2012. This subset was determined based on the PASCALVOC2012 images that had a ground truth human attention map in the ML Interpretability Evaluation Benchmark. We observed that Faster R-CNN with a ResNet50 backbone generated saliency maps most similar to the predicted eye-fixations and the human attention masks in terms of MAE with values of $0.1700$ and $0.1145$ respectively. In terms of IoU, the SSD with a VGG backbone generated saliency maps most similar to the predicted eye-fixations and human attention masks with values of $0.2474$ and $0.3225$ respectively. 

**Table 2: Object Detection Models compared to DeepGazeIIE Predicted Eye-Fixations for PASCALVOC2012**

| Model       | MAE         | IoU           |
| :--:       |    :--:   |     :--:     |
| YOLOV5      | $0.2147$      | $0.1837$   |
| SSD-VGG16   | $0.1731$       | **0.2474**     |
| SSD-MobileNet   | $0.1737$        | $0.2086$     |
| Faster R-CNN   | **0.1700**     | $0.2382$      |
| RetinaNet   | $0.2578$   | $0.2158$    |
| Mask R-CNN   | $0.1753$       | $0.2353$    |
| DETR   | $0.1913$      | $0.1664$     |

**Example Saliency Map Results**

<figure>
  <img src="/assets/img/pascal-pred.png" alt="visualization of sample saliency maps." width="100%"/>
  <figcaption> Figure 9: Sample saliency maps from different models compared to the predicted eye-fixations (DeepGazeIIE) for PASCALVOC2012. </figcaption>
</figure> 

**Table 3: Object Detection Models compared to Human Attention Masks for PASCALVOC2012**

| Model       | MAE         | IoU           |
| :--:       |    :--:   |     :--:     |
| YOLOV5      | $0.1571$      | $0.2400$   |
| SSD-VGG16   | $0.1277$       | **0.3225**     |
| SSD-MobileNet   | $0.1765$        | $0.2086$     |
| Faster R-CNN   | **0.1145**     | $0.2438$      |
| RetinaNet   | $0.2073$   | $0.2313$    |
| Mask R-CNN   | $0.1254$       | $0.2234$    |
| DETR   | $0.1519$      | $0.2100$     |

**Example Saliency Map Results**

<figure>
  <img src="/assets/img/pascal-human.png" alt="visualization of sample saliency maps." width="100%"/>
  <figcaption> Figure 10: Sample saliency maps from different models compared to the human attention masks for PASCALVOC2012. </figcaption>
</figure> 


We identify a top preforming model in terms of MAE because this metric is not variable based on a threshold like IoU. We selected the top performing model for our main experiment to focus on the impact of the augmentations for one model instead of comparing the impact of augmentations across different models. Since Faster R-CNN performed the best for MAE on PASCALVOC2012, we use this model in our main experiment. 

### Main Experiment

We separately fine-tune a pre-trained Faster R-CNN on each data augmentation technique and with no data augmentation and then evaluate that model on the test images. We calculate mean average precision to understand the performance of each model and we calculate mean absolute error and intersection over union between the saliency maps generated by the model and the predicted eye-fixations or human attention masks. 

The Faster R-CNN generated saliency maps that were more similar to predicted eye-fixations in terms of MAE when using selective inpainting augmentation and in terms of IoU when using selective erasing. These augmentations impacted the mAP by at most 3%. 

**Table 4: Pre-trained Faster R-CNN Fine-tuned on PASCALVOC2012 Compared to Predicted Eye-Fixations**

| Augmentation      | mAP (IoU=0.5)       | MAE | IoU |
| :--:       |    :--:   |     :--:   |     :--:   | 
| Selective Erasing      | $0.754$      |  $0.1560$    |   **0.1878**    |  
| Selective Inpainting   | $0.763$       | **0.1552**       |  $0.1863$       | 
| Non-Trivial Transformations   | $0.781$        | $0.1581$      | $0.1762$       | 
| No augmentations | **0.787** | $0.1575$ | $0.1823$ | 


**Table 5: Pre-trained Faster R-CNN Fine-tuned on PASCALVOC2012 Compared to Human Attention Masks**

| Augmentation      | mAP (IoU=0.5)       | MAE | IoU |
| :--:       |    :--:   |     :--:   |     :--:   | 
| Selective Erasing      | $0.754$      |  **0.1561** | $0.2657$ |  
| Selective Inpainting   | $0.763$       | $0.1572$ | $0.2657$ | 
| Non-Trivial Transformations   | $0.781$        | $0.1600$ | $0.2676$ | 
| No augmentations | **0.787** | $0.1583$ | **0.2688** | 


## Limitations

**Access to Compute Power**

We did this entire project on Google Colab which limited us in terms of the GPU that we could use and the amount of memory we had. We were able to use Colab Pro, but even then the GPUs we were using were limited to 16GB which forced us to use smaller batch sizes than normal. 

**Pre-trained models trained on COCO**

The pre-trained models we used in our empirical study were from the PyTorch torchvision library <d-cite key="pytorchtorchvision"></d-cite> which are actually trained on the MSCOCO dataset, but we used PASCALVOC2012 for our study. We used PASCALVOC2012 because this is the dataset that the ML Interpretability Evaluation Benchmark <d-cite key="mohseni2020benchmark"></d-cite> uses for the object detection domain. Evaluating the pre-trained models on a different dataset could have impacted how we interpret our results. This is why we collect metrics for the pre-trained model when fine-tuned on the original PASCALVOC2012 without any augmentations.  

**Selective Erasing/Inpainted Derived from DeepGazeIIE**

The selective erasing and selective inpainting augmentations only used the predicted eye fixations to create the dataset which could explain the null results shown in Table 4. Future work should create a separate augmented dataset using the human attention masks instead of predicted eye-fixations.

## Future Work & Conclusion

Future work should explore these questions for just image classification instead of the task of object detection. Another possibility would be to create a novel loss function that incorporates the IoU between the saliency map generated from the model and the saliency map of the DeepGazeIIE or similar saliency prediction model. This will train the model to focus on semantically meaningful regions of the image with ground truth labels as shown by <d-cite key="cyborg"></d-cite>. Also, more in-depth analysis for tuning the threshold is helpful for selective erasing/inpainting to optimize on amount of pixels that are deleted/inpainted. This may change the metrics obtained for better or for worse. Additionally, a user survey can be conducted to see if the more human centered saliency maps make a significant impact on interpretability to humans.

Overall, we conduct two studies to understand how current object detection models compare to human attention and what techniques might improve them. We evaluate two novel data augmentation pipelines in addition to non-trivial transforms to see if they help saliency maps become more human centered without significantly sacrificing accuracy. With at most 3% mAP difference, we observe that data augmentations that are derived from predicted human attention can improve the mean absolute error and intersection over union between the model saliency and predicted attention. We do not observe anything significant for the human attention mask, primarily because the dataset was derived from predicted eye-fixations which could be slightly different from the human attention masks. 

## Code

<img src="/assets/img/github-brands.svg" alt="logo" width="3%"/> [GitHub Repository](https://github.com/Gkao03/Saliency-Map-Visualization)


<img src="/assets/img/google-drive-brands.svg" alt="logo" width="3%"/> [Augmented Models](https://drive.google.com/drive/folders/1BW068VgVoj0_CVFCGED3E61sekw-1R74?usp=sharing)


*We completed this project to satisfy the project requirement for [16-824: Visual Learning & Recognition](https://visual-learning.cs.cmu.edu/index.html). We want to thank the TAs and Professor for their hard work and dedication to the class throughout the semester.*
