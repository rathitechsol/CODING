#include <iostream>
using namespace std;
void bubbleSort(int arr[], int n) {
	for (int i = 0; i < n - 1; i++) {
		bool swapped = false;
		for (int j = 0; j < n - i - 1; j++) {
			if (arr[j] > arr[j + 1]) {
				int temp = arr[j];
				arr[j] = arr[j + 1];
				arr[j + 1] = temp;
				swapped = true;
			}
		}
		if (!swapped)
			break;
	}
}
void printArray(int arr[], int n) {
	for (int i = 0; i < n; i++)
		cout << arr[i] << " ";
	cout << endl;
}
int main() {
	int n;
	cout << "Enter number of elements: ";
	cin >> n;
	int* arr = new int[n];
	cout << "Enter " << n << " elements:\n";
	for (int i = 0; i < n; i++)
		cin >> arr[i];
	cout << "Original array: ";
	printArray(arr, n);
	bubbleSort(arr, n);
	cout << "Sorted array: ";
	printArray(arr, n);
	delete[] arr;
	return 0;
}




