import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, NotFoundException, BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { validate as uuidValidate } from 'uuid';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private validateUUID(id: string): void {
    if (!id || id.trim() === '') {
      throw new BadRequestException('Product ID is required');
    }
    
    if (!uuidValidate(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }
  }

  @Get()
  async findAll(@Query('categoryId') categoryId?: string) {
    try {
      console.log('GET /api/products called'); // Log para debugging
      
      let products;
      if (categoryId) {
        products = await this.productsService.findByCategory(categoryId);
      } else {
        products = await this.productsService.findAll();
      }

      console.log(`Found ${products.length} products`); // Log para debugging

      return products; // Simplificar respuesta para debugging
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Failed to retrieve products: ' + error.message);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.validateUUID(id);

    try {
      const product = await this.productsService.findOne(id);
      if (!product) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }
      return {
        success: true,
        message: 'Product retrieved successfully',
        data: product
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching product:', error);
      throw new InternalServerErrorException('Failed to retrieve product');
    }
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      console.log('POST /api/products called with:', createProductDto); // Log para debugging
      
      if (!createProductDto.name || createProductDto.name.trim() === '') {
        throw new BadRequestException('Product name is required');
      }
      if (!createProductDto.price || createProductDto.price <= 0) {
        throw new BadRequestException('Valid price is required');
      }
      if (!createProductDto.categoryId && !createProductDto.category) {
        throw new BadRequestException('Category ID or category name is required');
      }

      const product = await this.productsService.create(createProductDto);
      console.log('Product created:', product); // Log para debugging
      
      return product; // Simplificar respuesta para debugging
    } catch (error) {
      console.error('Error creating product:', error);
      if (error.message === 'Category not found') {
        throw new BadRequestException('Category not found');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create product: ' + error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    this.validateUUID(id);

    console.log('PUT /api/products/:id called with:', { id, updateProductDto }); // Debug log

    if (Object.keys(updateProductDto).length === 0) {
      throw new BadRequestException('At least one field must be provided for update');
    }

    if (updateProductDto.price !== undefined && updateProductDto.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    try {
      const product = await this.productsService.update(id, updateProductDto);
      if (!product) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }
      
      console.log('Product updated successfully:', product); // Debug log
      
      return {
        success: true,
        message: 'Product updated successfully',
        data: product
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating product:', error);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    this.validateUUID(id);

    try {
      const success = await this.productsService.delete(id);
      if (!success) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }
      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting product:', error);
      throw new InternalServerErrorException('Failed to delete product');
    }
  }

  @Put(':id/stock')
  async updateStock(@Param('id') id: string, @Body() body: { quantity: number }) {
    this.validateUUID(id);
    if (body.quantity === undefined || typeof body.quantity !== 'number') {
      throw new BadRequestException('Valid quantity is required');
    }

    try {
      const product = await this.productsService.updateStock(id, body.quantity);
      if (!product) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }
      return {
        success: true,
        message: 'Stock updated successfully',
        data: product
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating stock:', error);
      throw new InternalServerErrorException('Failed to update stock');
    }
  }

  @Put(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    this.validateUUID(id);

    try {
      const product = await this.productsService.toggleActive(id);
      if (!product) {
        throw new NotFoundException(`Product with ID '${id}' not found`);
      }
      return {
        success: true,
        message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
        data: product
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error toggling product status:', error);
      throw new InternalServerErrorException('Failed to toggle product status');
    }
  }
}
