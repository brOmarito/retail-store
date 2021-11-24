const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findAll({
      include: [
        {model: Product},
      ]
    });
    res.status(200).json(tagData);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [
        {model: Product},
      ]
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag data found with that ID!' });
    }

    res.status(200).json(tagData);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.post('/', async (req, res) => {
  // create a new tag
  try {
    const tagData = await Tag.create(req.body);
    let productTagData = null;
    if (req.body.productIds && req.body.productIds.length) {
      const productTagArr = req.body.productIds.map((productId) => {
        return {
          product_id: productId,
          tag_id: tagData.tagId,
        }
      });
      productTagData = await ProductTag.bulkCreate(productTagArr);
    }

    res.status(200).json(tagData);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.put('/:id', async (req, res) => {
  // update a tag's name by its `id` value
  try {
    const tagData = await Tag.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    const productTagData = await ProductTag.findAll({
      where: { tag_id: req.params.id },
    });
    const tagProductIds = productTagData.map(({ product_id }) => product_id);

    // Get array of ProductTags that need creating
    const newProductTags = req.body.productIds
      .filter((product_id) => !tagProductIds.includes(product_id))
      .map((product_id) => {
        return {
          product_id,
          tag_id: req.params.id,
        };
      });

    // Create array of ProductTag IDs to be deleted
    const deleteProductTagIds = productTagData
      .filter(({ product_id }) => !req.body.productIds.includes(product_id))
      .map(({ id }) => id);

    // Bulk Create ProductTags
    const createdProductTags = await ProductTag.bulkCreate(newProductTags);
    const deletedProductTags = await ProductTag.destroy({ where: { id: deleteProductTagIds }});

    // Create object to return with updated info
    const updatedData = {
      updatedTags: tagData,
      createdProductTags: createdProductTags,
      deletedProductTags: deletedProductTags,
    }

    res.status(200).json(updatedData);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagData = await Tag.destroy({ where: { id: req.params.id }});
    res.status(200).json(tagData);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
