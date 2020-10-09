import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:image_cropper/image_cropper.dart';

class Button extends StatelessWidget {
  Function _onClick;
  Button(this._onClick);
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      child: Text(
        'button text',
        style: TextStyle(fontSize: 20),
      ),
      onTap: () {
        _getFromGallery();
      },
    );
  }

  /// Get from gallery
  _getFromGallery() async {
    PickedFile pickedFile = await ImagePicker().getImage(
      source: ImageSource.gallery,
      maxWidth: 1800,
      maxHeight: 1800,
    );
    _cropImage(pickedFile.path);
  }

  /// Crop Image
  _cropImage(filePath) async {
    File croppedImage = await ImageCropper.cropImage(
        sourcePath: filePath,
        maxWidth: 1080,
        maxHeight: 1080,
        aspectRatio: CropAspectRatio(ratioX: 1.0, ratioY: 0.5));
  }
}
